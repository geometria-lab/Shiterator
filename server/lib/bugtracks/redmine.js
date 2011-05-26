var http = require('http');

module.exports = Redmine = function() {

}

Redmine.prototype.get = function(error) {
    var options = {
      host   : 'www.google.com',
      port   : 80,
      path   : '/upload',
      method : 'GET'
    };

    http.request(options, function() {

    });
}

Redmine.prototype.post = function(error) {

}

module.exports = Redmine.Issue = function() {
    
}

Redmine.Issue.prototype.update = function(error) {

}