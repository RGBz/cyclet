Simple, unidirectional data flow for React Native.

Cyclet is inspired by Facebook's [Flux](https://facebook.github.io/flux/). It is a very simple implementation of a unidirectional data flow that uses Facebook's [EventEmitter](https://www.npmjs.com/package/fbemitter) and [Immutable.js](https://facebook.github.io/immutable-js/).

## What problem does this solve?

Applications can get complex quickly. Cyclet helps make application development easier by forcing all data changes in your app to follow a simple predictable pattern:

1. Tell your client-side datastores about a change you want to happen
2. Each datastore updates itself based on the update you're broadcasting
3. React components re-render automatically as the datastores finish updating

*** UPDATE NOTE (Cyclet 1.2 & ES6): ***
If you're already using Cyclet, you might notice that this README doesn't look familiar. That's because Cyclet has been updated to be based on composition instead of React Mixins to play better with ES6 classes. Not to worry though! **Cyclet 1.2 is fully backwards compatible with 1.1**. It is recommended that you use the new approach outlined in this updated README going forward, but here are the [Cyclet 1.1 docs](Cyclet-1.1.md) for reference.

## How It Works: Actions and Stores

Cyclet uses two simple concepts to pull off its unidirectional data flow: **Actions** and **Stores**. Actions represent the change you want to happen and Stores are simply the datastores that update themselves when they're told about the change you want to happen.

# A simple example

Read through this example and its comments to see how to use Cyclet.

``` javascript
import React, {
  View,
  Text,
  TouchableHighlight,
  PropTypes
} from 'react-native';

import Cyclet from 'cyclet';

// First let's create a trivial store to hold data about a person
const personStore = Cyclet.createStore({

    // The init method is automatically called when the store is constructed
    init() {
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
    $updateName(newName) {
      this.set({
        name: newName
      });
    },

    $increaseAge(amount) {
      this.set({
        age: this.get('age') + amount
      });
    },

    // You can also define other methods that will be accessible to React
    // components outside your store
    getAge() {
      return this.get('age');
    },

    getName() {
      return this.get('name');
    }

});

// Defining the React component is pretty straightforward...
class PersonView extends React.Component {

  render() {
    return (
      <View>
        <Text>
            {this.props.personName + " is " + this.props.personAge}
        </Text>
{/*
        Whenever this link is pressed, the "updateName" action
        is kicked off with 'Doug' as its only parameter.            
*/}
        <TouchableHighlight
            onPress={() => Cyclet.exec('updateName', 'Doug')}>
          <Text>
            Change Name
          </Text>
        </TouchableHighlight>
      </View>
    );
  }
}
// This PersonView expects to be passed a name and age. Where will they come from?...
PersonView.propTypes = {
    personName: PropTypes.string,
    personAge: PropTypes.number
};

// ...they get wired in via this "connectToStores" function...
module.exports = Cyclet.connectToStores(

    // ...that wraps the PersonView React Component with...
    PersonView,

    // ...a new React Component that listens on this list of Cyclet stores...
    [
        personStore
    ],

    // ...such that, any time any of the listed stores updates, this callback is
    // called to create a new set of props to pass to the PersonView.
    props => ({
        personName: personStore.getName(),
        personAge: personStore.getAge()
    })

);
```

# Best practices

## Directory structure

Create separate files for each store and put them in a directory called "stores" in your project.

## Actions

It's best to always start your action names off with verbs. For example `updateUser`, `fetchCompany`, `playSong`. When you kick-off an action you can pass as many arguments as you like to inform the necessary data change, but it's recommended that you use as few parameters as possible so you don't get confused by argument ordering. Some actions might not even need and arguments at all. For example, `logout`.

Action names are just strings so you can use special characters to namespace things if you wish.

## Stores

Store design is the trickiest part of coding a solid and comprehensible application. Each store should be focused on a certain kind of data. Good stores could be things like `userStore` to hold onto user data or `bookStore` to hold onto book data. Stores can also be used to cache data. For example, a `userStore` might hold cached copies of multiple users and you can define a `userStore.getUserById(userId)` method to pull a user out of the cache.

It is highly recommended that you exclusively use **Immutable.js** objects when putting things in a store. Immutable objects make your code very easy to reason about and guarantee that there's no data meddling outside of the standard Cyclet data flow.

# API

## Cyclet

### `createStore(storeDefinition)`

The storeDefinition paramater is an object. This object is used to define the store. It can contain the following kinds of proprties:

- `init` A function that gets called immediately after the store is constructed. This can be used to instantiate data for the store.
- `$actionNameGoesHere` Each action name (prefixed with a `$`) you set as a property should have a function value that's used to handle how the store should behave when the action is kicked-off. The arguments to this function should follow the order of the arguments passed when the action is called. Action listeners **must** be prefixed with a `$`!
- The final type of properties on a store are public functions. Any property you define that's not `init` or an action name will become accessible outside the store. This is how you can define getter methods that your React components can use to render the data from the store.

### `exec(actionName, ...actionArguments)`

Calling `Cyclet.exec('fetchUser', 123)` will kick-off the `fetchUser` action and pass `123` as an argument to all listening stores. You **do not** need to define actions ahead of time. Instead you just call them dynamically when you want to use them.

### `connectToStores(reactComponent, stores, getStateFromStores)`

This method is used to wrap the passed-in `reactComponent` with another React Component
that listens on the list of passed-in `stores`. When any of the `stores` changes state,
the passed-in `getStateFromStores` function is called and passed the `reactComponent`'s most recent set of props. The `getStateFromStores` function **must** return a map to be used as the updated set of props to pass to the `reactComponent` to trigger a re-render.

## Store

### `get(propertyName)`

Stores contain a private state object using Immutable.js. To access a property off this internal state object, you can use this `get` method along with the name of the property you want to access. You **should not** call this method from outside the store. Instead, create public getter methods on the store that your components can use.

### `set(updateDiff)`

Stores can also update this internal state object using `set`. Set actually calls Immutable.js's `merge` on the internal state object using the `updateDiff` object to merge in the data from `updateDiff`. When `set` is called, all components listening on the store will automatically be notified to re-render.

**Don't use `set` outside of the store either!** `set` should only be used in response to fired actions.

### `notifyListeners()`

You shouldn't mutate data on a store outside of calling `set`, but if for some crazy reason you need to, you can use `notifyListeners` to tell the listening React components to handle a change.
