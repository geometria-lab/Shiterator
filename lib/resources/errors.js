var jsonSchema = require('json-schema').validate,
    util       = require('util'),
    mongoose   = require('mongoose');

Project        = mongoose.model('Project'),
    TrackerManager = require('../trackers/manager.js');

var createSchema = {
    type: 'object',
    properties: {
        secret: { type: 'string' },
        request: {
            type: 'object',
            properties: {
                projectRoot : { type: 'string' },
                controller  : { type: 'string' },
                action      : { type: 'string' },
                host        : { type: 'string' },
                uri         : { type: 'string' },
                method      : { type: 'string' },
                userAgent   : { type: 'string' },
                postParams  : { type: 'object' },
                getParams   : { type: 'object' },
                sessionData : { type: 'object' },
                data        : { type: 'object' }
            },
            required: [ 'host', 'uri', 'method' ],
            additionalProperties: false
        },
        errors: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    type:    { type: 'string' },
                    message: { type: 'string' },
                    file:    { type: 'string' },
                    line:    { type: 'number' },
                    stack:   {
                        type  : 'array',
                        items : {
                            type: 'object',
                            properties: {
                                file: { type: 'string' },
                                line: { type: 'number' },
                                'function': { type: 'string' }
                            },
                            required: [ 'file', 'line', 'function' ],
                            additionalProperties: false
                        }
                    }
                },
                required: [ 'type', 'message', 'file', 'line', 'stack' ],
                additionalProperties: false
            }
        }
    },
    required: ['secret', 'request', 'errors'],
    additionalProperties: false
};

var Errors = {
    create : function (req, res) {
        var result = jsonSchema.validate(req.body, createSchema);

        if (!result.valid) {
            var error = new Error('Invalid format:' + util.inspect(result.errors));
            error.code = 400;
            throw error;
        }

        Project.findOne({ secret : req.body.secret }, function(err, doc){
            if (!doc || err) {
                var error = new Error('Invalid secret');
                error.code = 401;
                throw error;
            } else {
                res.send(200);
            }

            doc.trackerLinks.forEach(function(trackerLink) {
                var tracker = TrackerManager.get(trackerLink);
                req.body.errors.forEach(function(error) {
                    tracker.addError(req.body.request, error);

                    //if (error.stack.length === 0) {
                    //    console.log('Error, empty stack: ' + req.body);
                    //}
                });
            });
        });
    }
};

module.exports = function (express) {
    express.resource('errors', Errors);
};