var EventEmitter = require('EventEmitter');
var Immutable = require('immutable');

class Store {

    constructor(actionEmitter, definition) {
        this._updateEmitter = new EventEmitter();
        this._state = Immutable.fromJS({});
        if (definition.init) {
            definition.init.bind(this)();
        }
        for (var key in definition) {
            if (key[0] === '$') {
                var actionName = key.substring(1);
                actionEmitter.addListener(actionName, definition[key].bind(this));
            }
            else if (key !== 'init') {
                this[key] = definition[key].bind(this);
            }
        }
    }

    addListener(listener) {
        return this._updateEmitter.addListener('update', listener);
    }

    get(key) {
        return this._state.get(key);
    }

    set(updateDiff, callback) {
        this._state = this._state.merge(updateDiff);
        this.notifyListeners();
        if (callback) {
            callback();
        }
    }

    clear() {
        this._state = Immutable.fromJS({});
        this.notifyListeners();
    }

    notifyListeners() {
        this._updateEmitter.emit('update');
    }

}

class Unicycle {

    constructor() {
        this._actionEmitter = new EventEmitter();
    }

    createStore(definition) {
        return new Store(this._actionEmitter, definition);
    }

    listenTo(store, methodName) {
        var onStoreUpdate = function () { this.forceUpdate(); };
        var subscription;
        var mixin = {

            componentDidMount() {
                subscription = store.addListener(methodName ? this[methodName] : onStoreUpdate.bind(this));
            },

            componentWillUnmount() {
                subscription.remove();
            }

        };
        return mixin;
    }

    exec() {
        this._actionEmitter.emit(...arguments);
    }

}

module.exports = new Unicycle();
