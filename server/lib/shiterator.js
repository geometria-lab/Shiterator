// Get options
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var fs = require('fs'),
    optionsString = fs.readFileSync('./config/application.json', 'utf8'),
    options = JSON.parse(optionsString)[process.env.NODE_ENV];

var Shiterator = require('./server.js');

var shiterator = new Shiterator(options);
shiterator.listen();