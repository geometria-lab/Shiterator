// Start server
var http = require('http'),
    utils = require('./utils.js');

var Errors = require('./errors.js');

module.exports = Server = function(options) {
    this._options = utils.merge({
        host : '0.0.0.0',
        port : 6666,

        updateInterval : 50, //60 * 3, // 3 minute

        tracker : {
            name     : null,
            host     : null,
            port     : 80,
            login    : null,
            password : null
        }
    }, options);

    if (this._options.tracker.constructor == Object) {
        var tracker = Server.BUGTRACKS[this._options.tracker.name];
        this._tracker = new tracker(this._options.tracker);
    } else {
        this._tracker = this._options.tracker;
    }

    this._errors = new Errors(this);

    this._httpServer = http.createServer();
    this._httpServer.on('request', this._handleRequest.bind(this));

    this._updateInterval = setInterval(this._postErrors.bind(this),
                                       this._options.updateInterval);
}

Server.prototype._postErrors = function() {
    this._errors.post(this._tracker);
    this._errors.clear();
}

Server.prototype._handleRequest = function(request, response) {
    var errorsRaw = ''
    request.on('data', function(chunk) {
        errorsRaw += chunk;
    });
    request.on('end', function() {
        response.writeHead(201);
        response.end();

        try {
            var errorsJson = JSON.parse(errorsRaw);
        } catch (e) {

        }

        if (Array.isArray(errorsJson) && errorsJson.length) {
            for (var i = 0; i < errorsJson.length; i++) {
                var error = Error.create(errorsJson[i]);
                if (error && this._tracker.isValidError(error)) {
                    this._errors.add(error);
                }
            }
        }
    }.bind(this));
}

Server.prototype.listen = function(port, host) {
    this._httpServer.listen(port || this._options.port, host || this._options.host);
}

Server.BUGTRACKS = {
    redmine : require('./trackers/redmine.js')
}