// Start server
var http = require('http'),
    utils = require('./utils.js');

var Errors = require('./errors.js');

var RedmineBugTrack = require('./bugtrack/redmine.js');

module.exports = Server = function(options) {
    this._options = utils.merge({
        host : '0.0.0.0',
        port : 6666,

        updateInterval : 60, // 1 minute

        bugtrack : 'redmine'
    }, options);

    this._bugtrack = new RedmineBugTrack();

    this._errors = new Errors(this);

    this._httpServer = http.createServer();
    this._httpServer.on('request', this._handleRequest.bind(this));

    this._updateInterval = setInterval(this._postErrors.bind(this._errors),
                                       this._options.updateInterval);
}

Server.prototype._postErrors = function() {
    this._errors.post(this._bugtrack);
    this._errors.clear();
}

Server.prototype._handleRequest = function(request, response) {
    var raw = ''
    request.on('data', function(chunk) {
        raw += chunk;
    });
    request.on('end', function() {
        var error = Error.create(raw);

        if (error) {
            this._errors.add(error);
            response.writeHead(200);
            response.end();
        } else {
            response.writeHead(401);
            response.end();
        }
    }.bind(this));
}

Server.prototype.listen = function(port, host) {
    this._httpServer.listen(port || this._options.port, host || this._options.host);
}

