# Unicycle
Simple unidirectional data flow for React Native.

Unicycle is inspired by Facebook's Flux. It is a very simple implementation of a unidirectional data flow that uses [React Native's](https://facebook.github.io/react-native/) **EventEmitter** and [Immutable.js](https://facebook.github.io/immutable-js/). In Unicycle, there are two concepts: **Actions** and **Stores**.

## Actions
Actions are named events that stores can listen to. Unicycle actions are dynamic so you don't define actions ahead of time. Instead, you only refer to them when you execute them or listen to them (via stores).
When you execute an action with `Unicycle.exec` you can specify any parameters you like. These parameters will be passed along to any listeners of the action being executed.

For example, to execute an action, simply call:

``` javascript
Unicycle.exec('actionName', param1, param2, param3);
```

## Stores
Stores contain state and listen to actions.
When an action is triggered, they have an opportunity to update their internal state.
A store should only manage state using built-in `set` and `get` methods.
You should not attach other values to the store object dynamically.
A store's state is backed by **Immutable.js** and it's recommended that you use **Immutable.js** objects with the store.

React Native components can "listen to" stores via the `Unicyle.listenTo` method.
When a component is listening to a store, it will automatically re-render itself when the store's state changes.

##An Example

``` javascript
var React = require('react-native');
var {
  View,
  Text,
  TouchableHighlight
} = React;
var Unicycle = require('./Unicycle');

var personStore = Unicycle.createStore({
    
    // The init method is automatically called when the store is constructed
    init: function () {
      // Stores come with two built-in methods backed by Immutable.js: "set" and "get"
      // React components can "listen" on stores.
      // When you call "set" on a store, all listenining components will be notified
      this.set({
        name: 'Claud',
        age: 82
      });
    },
    
    // You can easily listen to actions by prefixing their name with a $
    $updateName: function (newName) {
      this.set({
        name: newName
      });
    },
    
    $increaseAge: function (amount) {
      this.set({
        age: this.get('age') + amount
      });
    },
    
    // You can also define other methods that will be accessible outside your store
    getAge: function () {
      return this.get('age');
    },
    
    getName: function () {
      return this.get('name');
    }
    
});

var App = React.createClass({

  mixins: [
    Unicycle.listenTo(personStore)
  ],
  
  render: function () {
    return (
      <View>
        <Text>{personStore.getName() " is " + personStore.getAge()}</Text>
        <TouchableHighlight onPress={() => Unicyle.exec('updateName', 'Doug')}>
          <Text>Change Name</Text>
        </TouchableHighlight>
      </View>
    );
  }

});
```

# API

##Unicycle API

``` javascript
Unicycle.createStore(storeDefinition: Object)
```

This method is used to create a store. Refer to the example above for details.

``` TypeScript
Unicycle.exec(actionName: String, ...params);
```

This method executes an action by its name. Any stores listening on the action will be passed the params specified.

```javascript
Unicycle.listenTo(store: Store, methodName: String)
```

This method constructs a mixin that you can add to a React Native component.
Whenever the state of the store changes, the method whose name matches `methodName` on the component will be called.
When this method is called, **it will not be passed any data**.
Instead, you should retrieve the data from the store through the custom methods you define on the store.

In fact, the `methodName` is entirely optional and should only be used if you want to do something special when the store's state changes. Otherwise you can just let the component re-render itself using the store's updated state.

##Store API

``` javascript
init()
```

This is automatically called when the store is constructed. You cannot call this method on the store after that.

``` javascript
set(updateDiff: Object, callback: Function)
```

This method is similar to React's `setState` in that it merges the `updateDiff` argument into the existing state of the store.
You should never call `set` from outside a store. It should only be called at `init` time or in response to an action.

Calling `set` automatically notifies any listening components of the store's state change.

The `callback` is optional and will simply be called after the store's state changes. This is useful if you want to do things like persistence from the store after its state changes.

``` javascript
get(propertyName: String)
```

This method simply returns the value of the store's state for this property name.

``` javascript
notifyListeners()
```

If for some reason you need to notify the components listening to a store, you can call this to force it.

**Action Listener Methods**

You can listen to actions by simply prefixing an action name with a `$` as a property on the object you use to define the store. 

For example:
``` javascript
var store = Unicycle.createStore({
  $actionName: function (arg) {
    console.log("This action was executed with the argument: ", arg);
  }
});
```

**Custom Methods**

You can define other methods on the store to expose getters or to simply provide convenience methods that you use internally inside the store. Any property you define when calling `Unicyle.createStore` that doesn't 1) start with a `$` 2) is not `init`, `set`, `get` or `notifyListeners` will automatically become a publicly accessible method on the store.

For example:
``` javascript
var store = Unicycle.createStore({
  init: function () {
    this.set({title: "Run for your life!"});
  },
  getTitle: function () {
    return this.get('title');
  }
});
```
