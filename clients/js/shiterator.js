(function() {
    Shiterator = function(callback, options) {
        // It is supposed to be only one instance of Shiterator
        if (this.constructor._Instance) {
            return this.constructor._Instance;
        } else {
            this.constructor._Instance = this;
        }

        this.__callback = callback || noop;

        this._options = merge({
            host: null,
            port: 6060,
            postingPeriod: 5,          // in seconds
            forgetErrorsAfter: 1,      // in days, 0 means "1 year"
            errorsLimit: 10,
            stackTraceLimit: 1024,     // in symbols, 0 means "1Mb",
            ignoreBrowsers: {},
            acceptErrors: 'all'        // 'all' | 'domain' | 'subdomain' | RegExp
        }, options);

        this.__ShiteratorInit();
    };

    Shiterator.prototype.__ShiteratorInit = function() {
        this.__started = false;

        this.__errorsToPost = [];

        this.__knownErrors = new ErrorStorage(this._options.forgetErrorsAfter || 365);

        this.__errorsCount = 0;

        this.__postErrorTimeout = null;

        this.__form = null;

        new ErrorHandler(this.__errorHandler,
                         this._options.ignoreBrowsers,
                         this._options.acceptErrors,
                         this);
    };

    Shiterator.prototype.__getFullUrl = function() {
        if (this._options.host) {
            return (this._options.host.indexOf('http://') !== 0 ? 'http://' : '') +
                    this._options.host +
                   (this._options.port ? ':' + this._options.port : '');
        }
        return null;
    };

    Shiterator.prototype.__convertErrorToData = function(message, file, line, trace) {
        var stackTraceLimit = this._options.stackTraceLimit || 1e6;

        return {
            'type'      : 'javascript',
            'subject'   : message + ' on ' + file + ':' + line,
            'message'   : message,
            'line'      : line,
            'stack'     : trace ? trace.toString().substring(0, stackTraceLimit) : 'not available',
            'tracker'   : {},
            'file'      : file,
            'custom'    : {
                'url'      : document.location.href,
                'referer'  : document.referrer
            }
        };
    };

    Shiterator.prototype.__errorHandler = function(message, file, line, trace) {
        if (!this.__started ||
            this.__errorsCount >= this._options.errorsLimit) {
            return true;
        }

        var self = this;
        var id = foldString(message + ' on ' + file + ':' + line);
        var error = this.__convertErrorToData(message, file, line, trace);

        if (!this.__knownErrors.has(id)) {
            this.__callback.call(window, error);

            this.__knownErrors.put(id);
            this.__errorsToPost.push(error);
            this.__errorsCount++;

            if (!this.__postErrorTimeout) {
                this.__postErrorTimeout = setTimeout(function() {
                    onDomReady(self.__submitErrors, self);
                }, this._options.postingPeriod * 1000);
            }
        }

        return false;
    };

    Shiterator.prototype.__submitErrors = function() {
        if (!this.__getFullUrl()) {
            return;
        }

        if (!this.__form) {
            // create form & iframe
            var box = document.createElement('div');
            box.style.display = 'none';
            box.innerHTML = '<form action="' + this.__getFullUrl() + '" method="post" target="shiterator-error-frame" name="shiterator-form">' +
                            "<input type='hidden' name='errors' value=''>" +
                            '</form>' +
                            '<iframe id="shiterator-error-frame" name="shiterator-error-frame"></iframe>';

            document.body.appendChild(box);

            this.__form = box.getElementsByTagName('form')[0];
        }

        var iframe = box.getElementsByTagName('iframe')[0];
        var input = box.getElementsByTagName('input')[0];

        var JSONString = JSONToString(this.__errorsToPost);

        input.setAttribute('value', JSONString);

        iframe.onload = function() {
            iframe.onload = null;
            self.stop();
        };

        document['shiterator-form'].submit();
    };

    Shiterator.prototype.start = function () {
        this.__started = true;
    };

    Shiterator.prototype.stop = function () {
        if (this.__started) {
            this.__errorsToPost.length = 0;
            this.__errorsCount = 0;
            this.__started = false;
            clearTimeout(this.__postErrorTimeout);
        }
    };
    

    var ErrorStorage = function(expireAfterDays) {
        this.__storage;

        this.__expires;

        this.__retrieveFromCookies(expireAfterDays);
    };

    ErrorStorage.prototype.__retrieveFromCookies = function(expireAfterDays) {
        this.__storage = [];

        var storedData = this.__getCookie('shiterator');
        if (storedData) {
            this.__storage = storedData.split('/');
        }

        var expirationTimestamp = this.__storage.shift();
        if (!expirationTimestamp) {
            expirationTimestamp = new Date((new Date()).getTime() + expireAfterDays * 1000 * 60 * 60 * 24);
        }

        this.__expires = this.__expires = expirationTimestamp;
    };
    
    ErrorStorage.prototype.__setCookie = function(name, value, expires) {
        var today = new Date();
        today.setTime(today.getTime());
        var expires_date = new Date(expires);

        document.cookie = name + "=" + encodeURIComponent(value) +
                          (expires ? ";expires=" + expires_date.toGMTString() : "");
    };

    ErrorStorage.prototype.__getCookie = function(check_name) {
        var allCookies = document.cookie.split(';');
        var tempCookie = '';
        var cookieName = '';
        var cookieValue = '';

        var i = allCookies.length;
        while (i--) {
            tempCookie = allCookies[i].split('=');

            cookieName = tempCookie[0].replace(/^\s+|\s+$/g, '');

            if (cookieName === check_name) {
                if (tempCookie.length > 1) {
                    cookieValue = decodeURIComponent(tempCookie[1].replace(/^\s+|\s+$/g, ''));
                }
                return cookieValue;
            }
        }

        return null;
    };

    ErrorStorage.prototype.__storeInCookies = function() {
        var cookie = [this.__expires].concat(this.__storage).join('/');

        this.__setCookie('shiterator', cookie, this.__expires);
    };

    ErrorStorage.prototype.has = function(key) {
        var i = this.__storage.length;
        while (i--) {
            if (this.__storage[i] === key) {
                return true;
            }
        }
        return false;
    };

    ErrorStorage.prototype.put = function(key) {
        this.__storage.push(key);
        this.__storeInCookies();
    };


    /*
     * ErrorHandler — object for cross-browser error capturing.
     * Uses window.onerror if supported and hijacks Error.prototype.toString otherwise.
     *
     * @private
     * @constructor
     * @param {function(message, file, line, trace)} fn Error handling function
     * @param {Object} ignore
     * @param {String|RegExp} accept
     * @param {Object} context Context for error handling function execution
     */
    var ErrorHandler = function(fn, ignore, accept, context) {
        // do not create error handler if the user agent is in 'ignored' list
        for (var b in ignore) {
            if (browser[b] && browser.version <= ignore[b]) {
                return;
            }
        }

        this.__hostMatch = this.__createHostMatchRegExp(accept);

        this.__handler = this.__createErrorHandler(fn, context);

        // Old WebKits ignore window.onerror, so trying to hijack Error.prototype.toString.
        if (browser.webkit && browser.version < 534.16) {
            this.__useErrorToString();
        } else if (browser.mozilla) {
            this.__useHybrid();
        } else {
            this.__useWindowOnError();
        }
    };

    ErrorHandler.prototype.__isHostAccepted = function(host) {
        return !!this.__hostMatch.exec(host);
    };

    ErrorHandler.prototype.__createHostMatchRegExp = function(accept) {
        var host = location.host;
        var protocol = "^[^/]+:\\/\\/";
        var search = "(\\/|\\?|#)";
        var re;

        if (typeof accept !== 'string' && !(accept instanceof RegExp)) {
            accept = accept.toString();
        }

        if (typeof accept === 'string') {
            // string
            switch (accept.toLowerCase()) {
                case 'all':
                    // accept all by default
                    re = new RegExp("", "i");
                    break;
                case 'domain':
                    re = new RegExp(protocol + host + search, "i");
                    break;
                case 'subdomain':
                    re = new RegExp(protocol + "([^?#/. ]+\\.)*" + host + search, "i");
                    break;
                default:
                    re = new RegExp(accept, "");
            }
        } else {
            // regexp
            re = accept;
        }

        return re;
    };

    /*
     * Set error handler using window.onerror
     *
     * @private
     */
    ErrorHandler.prototype.__useWindowOnError = function() {
        this.__previousErrorHandler = window.onerror;
        window.onerror = this.__handler;
    };

    /*
     * Set error handler using redefined Error.prototype.toString
     *
     * @private
     */
    ErrorHandler.prototype.__useErrorToString = function() {
        var self = this;

        Error.prototype.toString = function() {
            self.__handleError(self.__getParamsFromErrorObject(this));

            return this.message;
        }
    };

    /*
     * Set error handler using redefined Error.prototype.toString (Mozilla version)
     *
     * @private
     */
    ErrorHandler.prototype.__useHybrid = function() {
        var self = this;
        var error;

        // In Mozilla, Error.prototype.toString will be called for ALL errors,
        // even for ones that was already caught by try/catch.
        // So we don't run the handler here, just store an error.
        Error.prototype.toString = function() {
            error = self.__getParamsFromErrorObject(this);
            return this.message;
        };

        // Run the handler for previously stored error.
        window.addEventListener('error', function() {
            self.__handleError(error);
        }, false);

    };

    /*
     * Run error handler if error exists
     *
     * @private
     */
    ErrorHandler.prototype.__handleError = function(error) {
        if (error) {
            this.__handler(error.message, error.file, error.line, error.trace);
        }
    };

    /*
     * Get error parameters (message, file, line, trace) from error object
     *
     * @private
     */
    ErrorHandler.prototype.__getParamsFromErrorObject = function(error) {
        // Safari's error object
        if (error.sourceURL) {
            return {
                'message' : error.message,
                'file' : error.sourceURL,
                'line' : error.line
            };
        }

        // Mozilla's & Chrome's error object
        if (!error.stack) {
            // skip this error
            return null;
        }

        // Trying to retrieve file and line from stack trace
        var line = error.stack.match(/[a-z]+:\/\/[^:]+:\d+/)[0].split(':');
        return {
            'message': error.message,
            'file': line[0] + ':' + line[1],
            'line': line[2],
            'trace': error.stack
        }
    };

    /*
     * Bind error handler to defined context.
     *
     * @private
     */
    ErrorHandler.prototype.__createErrorHandler = function(fn, context) {
        if (typeof fn !== 'function') {
            return;
        }

        var self = this;
        context = context || window;

        return function(message, file, line) {
            if (self.__previousErrorHandler) {
                self.__previousErrorHandler.apply(context, arguments);
            }

            if (message && file && typeof line !== 'undefined' && self.__isHostAccepted(file)) {
                fn.apply(context, arguments);
            }

            // return true for webkit, and false otherwise
            return !!browser.webkit;
        }
    };


    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                this.getUTCFullYear()     + '-' +
                f(this.getUTCMonth() + 1) + '-' +
                f(this.getUTCDate())      + 'T' +
                f(this.getUTCHours())     + ':' +
                f(this.getUTCMinutes())   + ':' +
                f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {
        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string' ? c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':
            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':
            return String(value);

        case 'object':
            if (!value) {
                return 'null';
            }

            gap += indent;
            partial = [];

            if (Object.prototype.toString.apply(value) === '[object Array]') {
                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

            v = partial.length === 0 ? '{}' : gap ?
                '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
                '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }


    function JSONToString(value, replacer, space) {

        if (JSON && JSON.stringify) {
            return JSON.stringify(value, replacer, space);
        }

        var i;
        gap = '';
        indent = '';

        if (typeof space === 'number') {
            for (i = 0; i < space; i += 1) {
                indent += ' ';
            }

        } else if (typeof space === 'string') {
            indent = space;
        }

        rep = replacer;
        if (replacer && typeof replacer !== 'function' &&
                (typeof replacer !== 'object' ||
                typeof replacer.length !== 'number')) {
            throw new Error('JSON.stringify');
        }

        return str('', {'': value});
    }


    // merge two objects (not a deep copy)
    function merge(destination, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                destination[key] = source[key];
            }
        }
        return destination;
    }

    // empty function
    function noop() {}

    // simple string hash function
    function foldString(str) {
        var FOLD = 4;
        var MODULE = 0xffffffff;
        var strlen = str.length;
        var sum = 0;

        // add trailing zeros to make strlen divisible by FOLD
        if (strlen % FOLD) {
            str += '0000000'.substr(0, FOLD - strlen % FOLD);
        }

        // folding
        for(var i = 0, len = strlen / FOLD; i < len; ++i) {
            for(var j = 0; j < FOLD; ++j) {
                sum += str.charCodeAt(i * FOLD + j) << (j * 8);
            }
        }

        return '' + Math.abs(sum) % MODULE;
    }

    // run handler on DOMContentLoaded
    function onDomReady(handler, context){
        var called = false;
        context = context || window;

        function ready() {
            if (called) {
                return;
            }
            called = true;
            handler.apply(context, arguments);
        }

        if (document.readyState === 'interactive' ||
            document.readyState === 'complete') {
            ready();
        }

        if (document.addEventListener) {
            document.addEventListener("DOMContentLoaded", ready, false );
        } else if (document.attachEvent) {
            if (document.documentElement.doScroll && window.top) {
                function tryScroll(){
                    if (called) {
                        return;
                    }
                    if (!document.body) {
                        return;
                    }
                    try {
                        document.documentElement.doScroll("left");
                        ready();
                    } catch(e) {
                        setTimeout(tryScroll, 0);
                    }
                }
                tryScroll();
            }

            document.attachEvent("onreadystatechange", function(){
                if (document.readyState === "complete") {
                    ready();
                }
            });
        }
    }

    var browser = (function detectBrowser() {
        var rwebkit = /(webkit)[ \/]([\w.]+)/,
            ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
            rmsie = /(msie) ([\w.]+)/,
            rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/;

        var ua = navigator.userAgent.toLowerCase();

        var match = rwebkit.exec(ua) ||
                    ropera.exec(ua) ||
                    rmsie.exec(ua) ||
                    ua.indexOf("compatible") < 0 && rmozilla.exec(ua) ||
                    [];

        var browser = {};
        browser[match[1] || ""] = true;
        browser.version = parseFloat(match[2]) || 0;

        return browser;
    })();


})();

