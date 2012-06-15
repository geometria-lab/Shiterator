var trackers = {
    airbrake: require('./airbrake')
};

var TrackerManager = {

    __trackerInstances: {},

    get : function(trackerLink) {
        var hash = trackerLink.getHash();

        if (!this.__trackerInstances[hash]) {
            this.__trackerInstances[hash] = new trackers[trackerLink.tracker](trackerLink.options);
        }

        return this.__trackerInstances[hash];
    }
};

module.exports = TrackerManager;