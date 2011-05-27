// Start server
var http = require('http'),
    util = require('util'),
    utils = require('./utils.js');

var Errors = require('./errors.js'),
    ShiteratorError = require('./errors/error.js');

module.exports = Server = function(options) {
    this._options = utils.merge({
        host : '0.0.0.0',
        port : 6666,

        updateInterval : 60 * 1, // 3 minute

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
                                       this._options.updateInterval * 1000);
}

Server.prototype._postErrors = function() {
    var count = this._errors.post(this._tracker);
    this._errors.clear();
    util.log('Posted ' + count + ' errors to tracker');
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
                var error = ShiteratorError.create(errorsJson[i]);
                if (error && this._tracker.isValidError(error)) {
                    this._errors.add(error);
                }
            }
        }
    }.bind(this));
}

Server.prototype.listen = function(port, host) {
    port = port || this._options.port;
    host = host || this._options.host

    this._httpServer.listen(port, host);
    util.log('Shiterator started on ' + host + ':' + port);
}

Server.BUGTRACKS = {
    redmine : require('./trackers/redmine.js')
}