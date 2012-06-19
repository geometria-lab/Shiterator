var http = require('http'),
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
    var notice  = new Notice(this.__options.key, request, error),
        body    = notice.toXml(),
        options = {
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
        var body = '';
        response.on('data', function(chunk) {
            body += chunk;
        });
        response.on('end', function() {
            if (response.statusCode >= 300) {
                var explanation = body.match(/<error>([^<]+)/i);
                explanation = (explanation) ?
                              ':' + explanation[1] :
                              '';

                console.log('Notification failed ' + response.statusCode + explanation)
                console.log('Request: ' + body);
            } else {
                // Give me a break, this is legit : )
                var m = body.match(/<err-id>([^<]+)/i);
                var id = (m)
                    ? m[1]
                    : null;

                console.log('Created in airbrake: ' + id);
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