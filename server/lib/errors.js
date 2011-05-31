module.exports = Errors = function() {
    this._errors = {};
    this._errorsCount = {};

	this.types = {};
	this.typeDuplicates = {}
}

Errors.prototype.add = function(error) {
	if (!this._types[error.type]) {
        this.types[error.type] = 0;
        this.typeDuplicates[error.type] = 0;
	}

    if (!this._errors[error.subject]) {
        this.types[error.type]++;

        this._errorsCount[error.subject] = 0;
    } else {
	    this.typeDuplicates[error.type]++;
    }

    this._errors[error.subject] = error;
    this._errorsCount[error.subject]++;    

    return this;
}

Errors.prototype.post = function(tracker) {
    for (var subject in this._errors) {
        tracker.post(this._errors[subject], this._errorsCount[subject]);
    }
}

Errors.prototype.clear = function() {
    this._errors = {};
    this._errorsCount = {};

    return this;
}