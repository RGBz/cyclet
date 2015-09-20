Simple unidirectional data flow for React Native.

Cyclet is inspired by Facebook's [Flux](https://facebook.github.io/flux/). It is a very simple implementation of a unidirectional data flow that uses [React Native's](https://facebook.github.io/react-native/) **EventEmitter** and [Immutable.js](https://facebook.github.io/immutable-js/).

##What problem does this solve?

Applications can get complex quickly. Cyclet helps make application development easier by forcing all data changes in your app to follow a simple predictable pattern:

1. Tell your client-side datastores about a change you want to happen
2. Each datastore updates itself based on the update you're broadcasting
3. React components re-render automatically as the datastores finish updating

##Actions and Stores**

Cyclet uses two simple concepts to pull this off: **Actions** and **Stores**. Actions represent the change you want to happen and Stores are simply the datastores that update themselves when they're told about the change you want to happen.

# A simple example

Read through this example and its comments to see how to use Cyclet.

``` javascript
var React = require('react-native');
var {
  View,
  Text,
  TouchableHighlight
} = React;
var Cyclet = require('cyclet');

// First let's create a trivial store to hold data about a person
var personStore = Cyclet.createStore({

    // The init method is automatically called when the store is constructed
    init: function () {
      // Stores come with two built-in methods backed by Immutable.js:
      // "set" and "get"

      // When you call "set" on a store, all listening React components will
      // be re-rendered
      this.set({
        name: 'Claud',
        age: 82
      });
    },

    // To have a store listen to an action, simply put the action name with a $
    // before it as a property when creating the store.
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

    // You can also define other methods that will be accessible to React
    // components outside your store
    getAge: function () {
      return this.get('age');
    },

    getName: function () {
      return this.get('name');
    }

});

var PersonView = React.createClass({

  mixins: [      
      // This component will automatically re-render whenever "set" or
      // "notifyListeners" is called on the personStore
      personStore.tell()
  ],

  render: function () {
    return (
      <View>

        <Text>
            {personStore.getName() + " is " + personStore.getAge()}
        </Text>

        {
            // Whenever this link is pressed, the "updateName" action
            // is kicked off with 'Doug' as its only parameter.            
        }
        <TouchableHighlight onPress={() => Cyclet.exec('updateName', 'Doug')}>
          <Text>Change Name</Text>
        </TouchableHighlight>

      </View>
    );
  }

});
```

# Best practices

##Directory structure

Create separate files for each store and put them in a directory called "stores" in your project.

##Actions

It's best to always start your action names off with verbs. For example `updateUser`, `fetchCompany`, `playSong`. When you kick-off an action you can pass as many arguments as you like to inform the necessary data change, but it's recommended that you use as few parameters as possible so you don't get confused by argument ordering. Some actions might not even need and arguments at all. For example, `logout`.

##Stores

Store design is the trickiest part of coding a solid and comprehensible application. Each store should be focused on a certain kind of data. Good stores could be things like `userStore` to hold onto user data or `bookStore` to hold onto book data. Stores can also be used to cache data. For example, a `userStore` might hold cached copies of multiple users and you can define a `userStore.getUserById(userId)` method to pull a user out of the cache.

It is highly recommended that you exclusively use Immutable.js objects when putting things in a store. Immutable objects make your code very easy to reason about and guarantee that there's no data meddling outside of the standard Cyclet data flow.

# API

##Cyclet

`createStore(storeDefinition)`

The storeDefinition paramater is an object. This object is used to define the store. It can contain the following kinds of proprties:

- `init` A function that gets called immediately after the store is constructed. This can be used to instantiate data for the store.
- `$actionNameGoesHere` Each action name (prefixed with a `$`) you set as a property should have a function value that's used to handle how the store should behave when the action is kicked-off. The arguments to this function should follow the order of the arguments passed when the action is called. Action listeners must be prefixed with a `$`!
- The final type of properties on a store are public functions. Any property you define that's not `init` or an action name will become accessible outside the store. This is how you can define getter methods that your React components should use to render the data from the store.

`exec(actionName, ...actionArguments)`

Calling `Cyclet.exec('fetchUser', 123)` will kick-off the `fetchUser` action and pass `123` as an argument to all listening stores. You **do not** need to define actions ahead of time. Instead you just call them dynamically when you want to use them.

##Store

`get(propertyName)`

Stores contain a private state object using Immutable.js. To access a property off this internal state object, you can use this `get` method along with the name of the property you want to access. You **should not** call this method from outside the store. Instead, create public methods on the store that your components can use.

`set(updateDiff)`

Stores can also update this internal state object using `set`. Set actually calls Immutable.js's `merge` on the internal state object using the `updateDiff` object to merge in the data from `updateDiff`. When `set` is called, all components listening on the store will automatically be notified to re-render.

`tell(methodName)`

Tell is used to create a React mixin that a React component can listen on. If the optional `methodName` string is specified, the method on the React component with that matching name will be called. This gives to an opportunity to do custom handling of state changes on your React component. If `methodName` is not specified, all changes will trigger automatic re-renders via React's `forceUpdate()` method on the component.

`notifyListeners()`

You shouldn't mutate data on a store outside of calling `set`, but if for some crazy reason you need to, you can use `notifyListeners` to tell the listening React components to handle a change.
