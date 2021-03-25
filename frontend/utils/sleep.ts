export function sleep (ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

export function DelayFactory() {
    this.timeouts = {};
    this.intervals = {};
    this.items = {};

    this.create = function(id, callback, delay, isInterval) {
        if (this.items[id] !== null && this.items[id] !== undefined) {
            throw "DelayFactory: id " + id + " already exists";
        }
        if (isInterval) {
            this.createInterval(id, callback, delay);
        } else {
            this.createTimeout(id, callback, delay);
        }
    };

    this.createTimeout = function(id, callback, delay) {
        if (this.items[id] !== null && this.items[id] !== undefined) {
            throw "DelayFactory: id " + id + " already exists";
        }
        const self = this;
        this.timeouts[id] = setTimeout(function() {
            delete self.timeouts[id];
            delete self.items[id];
            callback();
        }, delay);
        this.items[id] = this.timeouts[id];
    };

    this.createInterval = function(id, callback, delay) {
        if (this.items[id] !== null && this.items[id] !== undefined) {
            throw "DelayFactory: id " + id + " already exists";
        }
        this.intervals[id] = setInterval(callback, delay);
        this.items[id] = this.intervals[id];
    };

    this.get = function(id) {
        return this.items[id];
    };

    this.destroy = function(id) {
        this.stop(id);
        this.remove(id);
    };

    this.stop = function(id) {
        const timeout = this.timeouts[id];
        if (timeout !== null && timeout !== undefined) {
            clearTimeout(timeout);
        }
        const interval = this.intervals[id];
        if(interval !== null && interval !== undefined) {
            clearInterval(interval);
        }
    };

    this.remove = function(id) {
        delete this.timeouts[id];
        delete this.intervals[id];
        delete this.items[id];
    };

    this.destroyAll = function() {
        for (let id in this.items) {
            this.stop(id);
        }
        this.timeouts = {};
        this.intervals = {};
        this.items = {};
    };
}
