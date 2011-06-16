var options = {
    host     : "0.0.0.0",
    port     : 6060,
    tracker  : {
        name         : "redmine",
        host         : "bugs.geometria-lab.net",
        login        : "ErrorBot",
        password     : "c87d8asudsadq87e6r23hdksaljdfowq837",
        customFields : {
            count : 22,
            line  : 18,
            file  : 17
        },
        statusNew : 3
    }
};

var Shiterator = require('./../server');

var shiterator = new Shiterator(options);
shiterator.listen();