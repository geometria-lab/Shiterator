var pivotal = require('pivotal'),
    util = require('util'),
    utils = require('./../utils.js');

module.exports = Pivotal = function(options) {
    this._options = utils.merge({
        token           : null,
        label           : 'shiterator',
        phpLabel        : 'php',
        javaScriptLabel : 'javascript'
    }, options);

    pivotal.useToken(this._options.token);
}

Pivotal.prototype.post = function(error, count) {
    count = count || 1;

    var errorLabel = this._options[ error instanceof JavaScript ? 'javaScriptLabel' : 'phpLabel'];

    var story = pivotal.getStories(
        error.tracker.project,
        { limit : 1, filter : 'label:"shiterator" label:"' + errorLabel + '" "' +  error.subject + '"' }
    );

    this._update(errorId, error, alreadyCount + count, status == this._options.statusNew);
} else {
    this._create(error, count);
};

Pivotal.prototype._create = function(error, count) {
    var body = '<?xml version="1.0" encoding="UTF-8"?>' +
               '<issue>' +
                   '<project_id>' + this._escape(error.tracker.project) + '</project_id>' +
                   '<tracker_id>' + this._escape(error.tracker.id) + '</tracker_id>' +
                   '<priority_id>' + this._escape(error.tracker.priority) + '</priority_id>' +
                   '<subject>' + this._escape(error.subject) + '</subject>' +
                   '<description>' + this._escape(this._getDescription(error)) + '</description>' +
                   '<custom_field_values>' +
                       '<' + this._options.customFields.file + '>' + this._escape(error.file) + '</' + this._options.customFields.file + '>' +
                       '<' + this._options.customFields.line + '>' + this._escape(error.line) + '</' + this._options.customFields.line + '>' +
                       '<' + this._options.customFields.count + '>' + this._escape(count) + '</' + this._options.customFields.count + '>' +
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
            var data = '';
            response.on('data', function(chunk) {
                data += chunk;
            });
            response.on('end', function() {
                util.log("Can't create Redmine issue. Response code: " + response.statusCode + '. Response body: ' + data + '. Error: ' + body);
            });
        }
    });
    request.on('error', function(e){
        util.log("Can't create Redmine issue: " + e.message);
    })
    request.write(body);
    request.end();
}

Pivotal.prototype._update = function(errorId, error, count, skipJournal) {
    var body = '<?xml version="1.0" encoding="UTF-8"?>' +
                       '<issue>' +
                           (skipJournal ? '<skip_journal>1</skip_journal>' : '') +
                           '<status_id>' + this._escape(this._options.statusNew) + '</status_id>' +
                           '<project_id>' + this._escape(error.tracker.project) + '</project_id>' +
                           '<tracker_id>' + this._escape(error.tracker.id) + '</tracker_id>' +
                           '<priority_id>' + this._escape(error.tracker.priority) + '</priority_id>' +
                           '<description>' + this._escape(this._getDescription(error)) + '</description>' +
                           '<custom_field_values>' +
                               '<' + this._options.customFields.file + '>' + this._escape(error.file) + '</' + this._options.customFields.file + '>' +
                               '<' + this._options.customFields.line + '>' + this._escape(error.line) + '</' + this._options.customFields.line + '>' +
                               '<' + this._options.customFields.count + '>' + this._escape(count) + '</' + this._options.customFields.count + '>' +
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
            var data = '';
            response.on('data', function(chunk) {
                data += chunk;
            });
            response.on('end', function() {
                util.log("Can't update Redmine issue. Response code: " + response.statusCode + '. Response body: ' + data + '. Error: ' + body);
            });
        }
    });
    request.on('error', function(e){
        util.log("Can't update Redmine issue: " + e.message);
    })
    request.write(body);
    request.end();
}

Pivotal.prototype._getDescription = function(error) {
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

Pivotal.prototype._addOptions = function(options) {
    return utils.merge({
        host   : this._options.host,
        port   : this._options.port,
        method : 'GET',
        headers : {
            Authorization : "Basic " + new Buffer(this._options.login + ":" + this._options.password).toString('base64')
        }
    }, options);
}

// TODO: Doesn't work properly
Pivotal.prototype._escape = function(text) {
    //return '<![CDATA[' + text.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;') + ']]>';
    return '<![CDATA[' + text.toString().replace(/\]\]>/g, ' ]>').replace(/<!\[CDATA\[/g, ' <!CDATA[') + ']]>';
}

Pivotal.prototype.isValidError = function(error) {
    for (var i = 0; i < Redmine.REQUIRED_FIELDS.length; i++) {
        if (!error.tracker[Redmine.REQUIRED_FIELDS[i]]) {
            return false;
        }
    }

    return true;
};

Pivotal.REQUIRED_FIELDS = [ 'project', 'id', 'priority' ];