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
    