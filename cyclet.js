import React, { Component } from 'react-native';
import {EventEmitter} from 'fbemitter';
import Immutable from 'immutable';
import shallowequal from 'shallowequal';

const onStoreUpdate = function () {
    this.forceUpdate();
};

const STORE_UPDATE_EMITTER_PRIVATE_KEY = Symbol();
const STORE_STATE_PRIVATE_KEY = Symbol();
const SUBSCRIPTIONS_BY_LISTENER_PRIVATE_KEY = Symbol();
const STORE_UPDATE_EVENT_KEY = Symbol();

const actionEmitter = new EventEmitter();

class Store {

    constructor(definition) {
        this[STORE_UPDATE_EMITTER_PRIVATE_KEY] = new EventEmitter();
        this[STORE_STATE_PRIVATE_KEY] = Immutable.fromJS({});
        this[SUBSCRIPTIONS_BY_LISTENER_PRIVATE_KEY] = Immutable.fromJS({});
        for (let key in definition) {
            if (key[0] === '$') {
                const actionName = key.substring(1);
                actionEmitter.addListener(
                    actionName,
                    definition[key].bind(this)
                );
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
        const store = this;
        let subscription;
        return {

            componentDidMount() {
                const listener = methodName ?
                    this[methodName] :
                    onStoreUpdate.bind(this);
                subscription = store[STORE_UPDATE_EMITTER_PRIVATE_KEY].addListener(
                    STORE_UPDATE_EVENT_KEY,
                    listener
                );
            },

            componentWillUnmount() {
                subscription.remove();
            }

        };
    }

    addListener(listener) {
        this[SUBSCRIPTIONS_BY_LISTENER_PRIVATE_KEY] = this[SUBSCRIPTIONS_BY_LISTENER_PRIVATE_KEY].set(
            listener,
            this[STORE_UPDATE_EMITTER_PRIVATE_KEY].addListener(
                STORE_UPDATE_EVENT_KEY,
                listener
            )
        );
    }

    removeListener(listener) {
        let subscription = this[SUBSCRIPTIONS_BY_LISTENER_PRIVATE_KEY].get(
            listener
        );
        if (subscription) {
            subscription.remove();
            this[SUBSCRIPTIONS_BY_LISTENER_PRIVATE_KEY] = this[SUBSCRIPTIONS_BY_LISTENER_PRIVATE_KEY].delete(listener);
        }
    }

    get(key) {
        return this[STORE_STATE_PRIVATE_KEY].get(key);
    }

    set(updateDiff, callback) {
        this[STORE_STATE_PRIVATE_KEY] = this[STORE_STATE_PRIVATE_KEY].merge(
            updateDiff
        );
        this.notifyListeners();
        if (callback) {
            callback();
        }
    }

    clear() {
        this[STORE_STATE_PRIVATE_KEY] = Immutable.fromJS({});
        this.notifyListeners();
    }

    notifyListeners() {
        this[STORE_UPDATE_EMITTER_PRIVATE_KEY].emit(STORE_UPDATE_EVENT_KEY);
    }

}

export default class Cyclet {

    static createStore(definition) {
        return new Store(definition);
    }

    static exec() {
        actionEmitter.emit(...arguments);
    }

    static connectToStores(Component, stores, getStateFromStores) {
        return class StoreConnectionWrapper extends React.Component {

            constructor(props) {
                super(props);
                this._handleStateChange = this._handleStateChange.bind(this);
                this.state = getStateFromStores(props);
            }

            componentDidMount() {
                stores.forEach(store =>
                    store.addListener(this._handleStateChange)
                );
            }

            componentWillReceiveProps(nextProps) {
                if (!shallowequal(nextProps, this.props)) {
                    this.setState(getStateFromStores(nextProps));
                }
            }

            componentWillUnmount() {
                stores.forEach(store =>
                    store.removeListener(this._handleStateChange)
                );
            }

            _handleStateChange() {
                this.setState(getStateFromStores(this.props));
            }

            render() {
                let props = {};
                for (let key in this.props) {
                    props[key] = this.props[key];
                }
                for (let key in this.state) {
                    props[key] = this.state[key];
                }
                return React.createElement(Component, props);
            }
        }
    }

}

module.exports = Cyclet;
