    /*
     * ErrorHandler — object for cross-browser error capturing.
     * Uses window.onerror if supported and hijacks Error.prototype.toString otherwise.
     *
     * @private
     * @constructor
     * @param {function(message, file, line, trace)} fn Error handling function
     * @param {Object} context Context for error handling function execution
     */
    var ErrorHandler = function(fn, context) {
        this.__handler = this.__createErrorHandler(fn, context);

        // Old WebKits ignore window.onerror, so trying to hijack Error.prototype.toString.
        if (this.__WEBKIT_LT_534_16) {
            this.__useErrorToString();
        } else if (this.__MOZILLA) {
            this.__useHybrid();
        } else {
            this.__useWindowOnError();
        }
    };

    /*
     * Is Mozilla
     * @const
     */
    ErrorHandler.prototype.__MOZILLA =
            !navigator.userAgent.match(/MSIE/) &&
            navigator.userAgent.match(/(Mozilla)(?:.*? rv:([\w.]+))?/);

    /*
     * Is WebKit
     * @const
     */
    ErrorHandler.prototype.__WEBKIT = navigator.userAgent.indexOf('WebKit') !== -1;

    /*
     * Is WebKit version lower than 534.16 (Safari 5 and Chrome < 10)
     * @const
     */
    ErrorHandler.prototype.__WEBKIT_LT_534_16 = +navigator.userAgent.replace(/.*AppleWebKit\/([0-9]+\.[0-9]+).*/, '$1') < 534.16;

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
            var error = self.__getParamsFromErrorObject(this);
            if (error) {
                self.__handler(error.message, error.file, error.line, error.trace);
            }

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
        // even for ones that was caught by try/catch.
        // So we don't run the handler here, just store an error.
        Error.prototype.toString = function() {
            error = self.__getParamsFromErrorObject(this);

            return this.message;
        };

        // Run the handler for previously stored error.
        window.addEventListener('error', function() {
            if (error) {
                self.__handler(error.message, error.file, error.line, error.trace);
            }
        }, false);

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

            if (message && file && typeof line !== 'undefined') {
                fn.apply(context, arguments);
            }

            // return true for webkit, and false otherwise
            return self.__WEBKIT;
        }
    };
