module.exports = Errors = function() {
    this._errors = {};
    this._errorsCount = {};
}

Errors.prototype.add = function(error) {
    if (!this._errors[error.subject]) {
        this._errorsCount[error.subject] = 0;
    }
    this._errors[error.subject] = error;
    this._errorsCount[error.subject]++;

    return this;
}

Errors.prototype.post = function(tracker) {
    var count = 0;
    for (var subject in this._errors) {
        count++;
        tracker.post(this._errors[subject], this._errorsCount[subject]);
    }

    return count;
}

Errors.prototype.clear = function() {
    this._errors = {};
    this._errorsCount = {};

    return this;
}