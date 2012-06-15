var fs       = require('fs'),
    express  = require('express'),
    mongoose = require('mongoose'),
    Resource = require('express-resource');

var Shiterator = function(options) {
    this.options = options;

    this.express = this.__createExpress();

    this.__addModels();
    this.__addResources(this.express);
};

Shiterator.prototype.listen = function() {
    var port = arguments[0] !== undefined ? arguments[0] : this.options.port;
    var host = arguments[1] !== undefined ? arguments[1] : this.options.host;

    this.express.listen(port || 3000, host);
};

Shiterator.prototype.__createExpress = function() {
    var app = express.createServer();

    app.configure(function(){
        app.use(express.methodOverride());
        app.use(express.bodyParser());
    });

    app.error(function(error, req, res, next){
        res.json({
            error : error.message
        }, error.code || 500);
    });

    return app;
};

Shiterator.prototype.__addModels = function() {
    mongoose.connect(this.options.mongo);

    var modelsPath = __dirname + '/models';
    fs.readdirSync(modelsPath).forEach(function(file) {
        require(modelsPath + '/' + file)
    });
};

Shiterator.prototype.__addResources = function(express) {
    var resourcesPath = __dirname + '/resources';
    fs.readdirSync(resourcesPath).forEach(function(file) {
        require(resourcesPath + '/' + file)(express)
    }.bind(this))
};

module.exports = Shiterator;