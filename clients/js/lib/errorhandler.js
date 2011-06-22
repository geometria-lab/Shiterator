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
