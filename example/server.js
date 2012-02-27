var options = {
    host     : "0.0.0.0",
    port     : 6060,
    updateInterval : 10,
    tracker  : {
        name  : "pivotal",
        token : "b8b05cd9d91c743fd601a1dc3768aead",
    }
};

var Shiterator = require('./../server');

var shiterator = new Shiterator(options);
shiterator.listen();