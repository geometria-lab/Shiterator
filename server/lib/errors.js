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
    for (var subject in this._errors) {
        tracker.post(this._errors[subject], this._errorsCount[subject]);
    }

    return this;
}

Errors.prototype.clear = function() {
    this._errors = {};
    this._errorsCount = {};

    return this;
}