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

        updateInterval : 60 * 3, // 3 minute
        
        cluster : true,

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
        if (!tracker) {
            throw new Error('Invalid tracker name');
        }
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
	this._errors.post(this._tracker);

	var types = [];
	for (var type in this._errors.types) {
		var error = this._errors.types[type];
		if (this._errors.typeDuplicates[type]) {
			error += ' (' + this._errors.typeDuplicates[type] + ')';
		}
		types.push(error + ' ' + type);
	}

	util.log('Posted ' + (types.length ? types.join(', ') : '0 errors')  + ' to tracker');
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
 
        if (request.headers['content-type'] &&
            request.headers['content-type'] === 'application/x-www-form-urlencoded') {
            var params = errorsRaw.split('&') ;
            for (var param in params ) {
                var pair = params[param].split('=') ;
                if (pair[0] == 'errors') {
                    // TODO: Where is pluses???
                    errorsRaw = decodeURIComponent(pair[1].replace(/\+/g, " "));
                }
            }
        }

        try {
            var errorsJson = JSON.parse(errorsRaw);
        } catch (e) {

        }

		var valid = true;
        if (Array.isArray(errorsJson) && errorsJson.length) {
            for (var i = 0; i < errorsJson.length; i++) {
                var error = ShiteratorError.create(errorsJson[i]);
                if (error && this._tracker.isValidError(error)) {
                    this._errors.add(error);
                } else {
					valid = false
				}
            }
        } else {
			valid = false;
		}

		if (!valid) {
			util.log('Invalid error format: ' + errorsRaw);
		}
    }.bind(this));
}

Server.prototype.listen = function(port, host) {
    port = port || this._options.port;
    host = host || this._options.host;
    
    this._httpServer.listen(port, host);

    util.log('Shiterator started on ' + host + ':' + port);
}

Server.BUGTRACKS = {
    redmine : require('./trackers/redmine.js')
}