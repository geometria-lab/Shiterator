var util = require('util'),
    xmlbuilder = require('xmlbuilder');

var fs   = require('fs'),
    packageJson = fs.readFileSync(__dirname + '/../../../package.json', 'utf8'),
    packageInfo = JSON.parse(packageJson);

var Notice = function(key, request, error) {
    this.key     = key;
    this.request = request;
    this.error   = error;
};

Notice.prototype.toXml = function() {
    var xml = xmlbuilder.create().begin('notice', {
        version: '1.0',
        encoding: 'UTF-8'
    });

    this.__appendHeaderXml(xml);
    this.__appendErrorXml(xml);
    this.__appendRequestXml(xml);
    this.__appendServerEnvironmentXml(xml);

    return xml.toString({ pretty: true });
};

Notice.prototype.__appendHeaderXml = function(xml) {
    xml.att('version', '2.1')
       .ele('api-key').txt(this.key).up()
       .ele('notifier')
           .ele('name').txt(packageInfo.name).up()
           .ele('version').txt(packageInfo.version).up()
           .ele('url').txt(packageInfo.homepage).up()
       .up();
};

Notice.prototype.__appendErrorXml = function(xml) {
    var error = xml.ele('error')
                       .ele('class').txt(this.error.type).up()
                       .ele('message').txt(this.error.message).up()
                       .ele('backtrace');

    this.error.stack.forEach(function(line) {
        if (!line.file) {
            line.file = 'unknown';
        }

        if (this.request.projectRoot) {
            line.file = line.file.replace(this.request.projectRoot, '[PROJECT_ROOT]');
        }

        error.ele('line')
                 .att('method', line.function)
                 .att('file',   line.file)
                 .att('number', line.line || 'unknown')
    }.bind(this));
};

Notice.prototype.__appendRequestXml = function(xml) {
    var request = xml.ele('request');

    var url = this.request.host;

    if (this.request.uri && this.request.uri.indexOf('/') !== 0) {
        url += '/';
    }

    url += this.request.uri;

    request.ele('url').txt(url);

    if (this.request.controller) {
        request.ele('component').txt(this.request.controller);
    }

    if (this.request.action) {
        request.ele('action').txt(this.request.action);
    }

    this.__appendRequestParamsXml(request, 'cgi-data', this.request.data || {});
    this.__appendRequestParamsXml(request, 'session', this.request.sessionData || {});

    var params = this.request.getParams || {};
    for (var name in (this.request.postParams || {})) {
        params[name] = this.request.postParams[name];
    }

    this.__appendRequestParamsXml(request, 'params', params);
};

Notice.prototype.__appendRequestParamsXml = function(request, type, vars) {
    var node;

    Object.keys(vars).forEach(function(key) {
        node = node || request.ele(type);

        if (vars[key]) {
            if (vars[key].constructor !== String && vars[key].constructor !== Number) {
                util.inspect(vars[key]);
            }

            node.ele('var')
                .att('key', key)
                .dat(vars[key]);
        }
    });
};

Notice.prototype.__appendServerEnvironmentXml = function(xml) {
    var serverEnvironment = xml.ele('server-environment');

    if (this.request.projectRoot) {
        serverEnvironment.ele('project-root').txt(this.request.projectRoot);
    }

    serverEnvironment.ele('environment-name').txt('production');
};

module.exports = Notice;