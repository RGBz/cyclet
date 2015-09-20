var EventEmitter = require('EventEmitter');
var Immutable = require('immutable');

var onStoreUpdate = function () {
    this.forceUpdate();
};

var updateEmitterKey = Symbol('updateEmitter');
var stateKey = Symbol('state');

var actionEmitter = new EventEmitter();

class Store {

    constructor(definition) {
        this[updateEmitterKey] = new EventEmitter();
        this[stateKey] = Immutable.fromJS({});
        for (var key in definition) {
            if (key[0] === '$') {
                var actionName = key.substring(1);
                actionEmitter.addListener(actionName, definition[key].bind(this));
            }
            else if (key !== 'init') {
                this[key] = definition[key].bind(this);
            }
        }
        if (definition.init) {
            definition.init.bind(this)();
        }
    }

    tell(methodName) {
        var store = this;
        var subscription;
        var mixin = {

            componentDidMount() {
                var listener = methodName ? this[methodName] : onStoreUpdate.bind(this);
                subscription = store[updateEmitterKey].addListener('update', listener);
            },

            componentWillUnmount() {
                subscription.remove();
            }

        };
        return mixin;
    }

    get(key) {
        return this[stateKey].get(key);
    }

    set(updateDiff, callback) {
        this[stateKey] = this[stateKey].merge(updateDiff);
        this.notifyListeners();
        if (callback) {
            callback();
        }
    }

    clear() {
        this[stateKey] = Immutable.fromJS({});
        this.notifyListeners();
    }

    notifyListeners() {
        this[updateEmitterKey].emit('update');
    }

}

var CycletHandler = {

    get(target, actionName) {
        if (actionName[0] === '$' && !(actionName in target)) {
            target[actionName] = function () {
                actionEmitter.emit(actionName, ...arguments);
            };
        }
        return target[actionName];
    }

};

var Cyclet {

    createStore(definition) {
        return new Store(definition);
    },

    exec() {
        actionEmitter.emit(...arguments);
    }

};

module.exports = Cyclet;
