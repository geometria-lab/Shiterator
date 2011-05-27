var http  = require('http'),
    xml   = require('o3-xml'),
    qs    = require('querystring'),
    utils = require('./../utils.js');

var util = require('util');

module.exports = Redmine = function(options) {
    this._options = utils.merge({
        host      : null,
        port      : 80,
        login     : null,
        password  : null,

        customFields : {
            count : null,
            line  : null,
            file  : null
        }
    }, options);
}

Redmine.prototype.post = function(error, count) {
    var params = {
            project_id : error.tracker.project,
            tracker_id : error.tracker.id,
            subject    : error.subject
        },
        options = {
            method : 'GET',
            path   : '/issues.xml?' + qs.stringify(params)
        };

    var request = http.request(this._addOptions(options), function(response) {
        var data = '';
        response.on('data', function(chunk) {
            data += chunk;
        });
        response.on('end', function() {
            var element     = xml.parseFromString(data).documentElement,
                errorIdNode = element.selectNodes('/issues/issue[1]/id/text()')[0],
                countNode   = element.selectNodes('/issues/issue[1]/custom_fields/custom_field[@id=' + this._options.customFields.count + ']/text()')[0];

            if (errorIdNode) {
                var errorId      = errorIdNode.nodeValue,
                    alreadyCount = parseInt(countNode.nodeValue);

                this._update(errorId, error, alreadyCount + count);
            } else {
                this._create(error, count);
            }
        }.bind(this));
    }.bind(this));
    request.end();
};

Redmine.prototype.isValidError = function(error) {
    for (var i = 0; i < Redmine.REQUIRED_FIELDS.length; i++) {
        if (!error.tracker[Redmine.REQUIRED_FIELDS[i]]) {
            return false;
        }
    }

    return true;
};

Redmine.prototype._create = function(error, count) {
    var body = '<?xml version="1.0" encoding="UTF-8"?>' +
               '<issue>' +
                   '<project_id>' + error.tracker.project + '</project_id>' +
                   '<tracker_id>' + error.tracker.id + '</tracker_id>' +
                   '<priority_id>' + error.tracker.priority + '</priority_id>' +
                   '<subject>' + error.subject + '</subject>' +
                   '<description>' + this._getDescription(error) + '</description>' +
                   '<custom_field_values>' +
                       '<' + this._options.customFields.file + '>' + error.file + '</' + this._options.customFields.file + '>' +
                       '<' + this._options.customFields.line + '>' + error.line + '</' + this._options.customFields.line + '>' +
                       '<' + this._options.customFields.count + '>' + count + '</' + this._options.customFields.count + '>' +
                   '</custom_field_values>' +
               '</issue>',
        options = {
            method  : 'POST',
            path    : '/issues.xml',
            headers : {
                'Content-Type'   : 'text/xml',
                'Content-Length' : body.length
            }
        };

    var request = http.request(this._addOptions(options), function(response) {
        if (response.statusCode != 201) {
            util.log("Can't create Redmine issue: " + util.inspect(error));
        }
    });
    request.write(body);
    request.end();
}

Redmine.prototype._update = function(errorId, error, count) {
    var body = '<?xml version="1.0" encoding="UTF-8"?>' +
                       '<issue>' +
                           '<skip_journal>1</skip_journal>' +
                           '<status_id>' + this._options.statusNew + '</status_id>' +
                           '<project_id>' + error.tracker.project + '</project_id>' +
                           '<tracker_id>' + error.tracker.id + '</tracker_id>' +
                           '<priority_id>' + error.tracker.priority + '</priority_id>' +
                           '<description>' + this._getDescription(error) + '</description>' +
                           '<custom_field_values>' +
                               '<' + this._options.customFields.file + '>' + error.file + '</' + this._options.customFields.file + '>' +
                               '<' + this._options.customFields.line + '>' + error.line + '</' + this._options.customFields.line + '>' +
                               '<' + this._options.customFields.count + '>' + count + '</' + this._options.customFields.count + '>' +
                           '</custom_field_values>' +
                       '</issue>',
                options = {
                    method  : 'PUT',
                    path    : '/issues/' + errorId + '.xml',
                    headers : {
                        'Content-Type'   : 'text/xml',
                        'Content-Length' : body.length
                    }
                };

    var request = http.request(this._addOptions(options), function(response) {
        if (response.statusCode != 200) {
            util.log("Can't update Redmine issue: " + util.inspect(error));
        }
    });
    request.write(body);
    request.end();
}

Redmine.prototype._getDescription = function(error) {
    var description = "    " + error.message +
           "\n\n\n\n" +
           "##Stack\n\n";

    var stack = error.stack.split("\n");
    for (var i = 0; i < stack.length; i++) {
        description += "    " + stack[i] + "\n";
    }

    description += "\n\n##Info\n\n";

    var info = utils.clone(error.custom);
    info.time = error.time;

    for (var field in info) {
        description += "* **" + field + "**: " + info[field] + "\n";
    }

    return description;
}

Redmine.prototype._addOptions = function(options) {
    return utils.merge({
        host   : this._options.host,
        port   : this._options.port,
        method : 'GET',
        headers : {
            Authorization : "Basic " + new Buffer(this._options.login + ":" + this._options.password).toString('base64')
        }
    }, options);
}

Redmine.REQUIRED_FIELDS = ['project', 'id', 'priority' ];