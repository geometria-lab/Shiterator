var http = require('http'),
    util = require('util'),
    Notice = require('./notice.js');

var Airbrake = function(options) {
    this.__options = {
        key:         null,
        serviceHost: 'api.airbrake.io',
        servicePort: 80,
        timeout:     30 * 1000
    };

    for (var name in options) {
        this.__options[name] = options[name];
    }
};

Airbrake.prototype.addError = function(request, error) {
    var notice  = new Notice(this.__options.key, request, error);

    try {
        var body = notice.toXml();
    } catch (e) {
        console.log('Notification failed: ' + e.message);

        return false;
    }

    var options = {
        host    : this.__options.serviceHost,
        port    : this.__options.servicePort,
        method  : 'POST',
        path    : '/notifier_api/v2/notices',
        headers : {
            'Content-Type'   : 'text/xml',
            'Content-Length' : body.length,
            'Accept'         : 'text/xml'
        }
    };

    var request = http.request(options, function(response) {
        var responseBody = '';
        response.on('data', function(chunk) {
            responseBody += chunk;
        });
        response.on('end', function() {
            if (response.statusCode >= 300) {
                var message = '';

                var m = responseBody.match(/<h1>([^<]+)/i);
                if (m) {
                    message += ': ' + m[1];
                    var m = responseBody.match(/<pre>([^<]+)/i);
                    if (m) {
                        message += ' ' + m[1];
                    }
                }

                util.log('Notification failed ' + response.statusCode + message + "\n\n" + 'Request was: ' + body);
            } else {
                var m = responseBody.match(/<err-id>([^<]+)/i);

                util.log('Created in airbrake: ' + ((m) ? m[1] : ''));
            }
        });
    });

    request.setTimeout(this.__options.timeout);
    request.on('error', function(e) {
        console.log('Notification failed: ' + e.message);
    });
    request.write(body);
    request.end();
};

module.exports = Airbrake;