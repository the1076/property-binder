# Property Binder
An ES6 Javacript library that allows one or two way binding to DOM elements for non-object properties of an object.

### Status
This library is currently being developed and its functionality may change drastically. All functionality and demos should be considered as "in-progress".

# Description
The "test.html" file has some examples for usage. I developed this for a different project and don't have time to document this properly, but the entire library is less than 500 lines, and it is written verbosely. Feel free to look through it, if you have any questions. There's not much to it, and it should be fairly easy to understand what the code is doing and how to use it.

You can't bind to sub objects because that causes a recursion headache that forces the library to keep a path of parent-child relationships. If you need to bind to an object that is a property of another object, just bind to it separately. 

# Usage
 - `PropertyBinder` is a static class with methods that allow you to bind as many different elements to a single object property as you would like.
   - `addBinding(object, binding)` adds a binding to the referenced object. It returns the bound object (you'll need to make changes to the returned object to see the results);
     Example:
     ```javascript
     let myObject = 
     {
         foo: 'bar',
         numba: 2,
         thisCantBeBound: { description: "but you CAN bind to this sub-object's properties by using the sub object as the target object, rather than the parent object."},
         favorites: ['pizza', 'tacos', 'fried chicken', 'lemons'],
         toggles: [true, false, true, true]
     };
     let $myInputElement = document.querySelector('.my-input');
     let $mySelectElement = document.querySelector('.my-select');
     let $someDiv = document.querySelector('div');
     let $aSection = document.querySelector('section');

     let afterEventFunction = (value) => 
     {
         //The return for this function doesn't affect anything.
         return 'This event fires whenever the values are changed. Good way to update other stuff, when properties are changed.';
     };
     let domTransformFunction = (value) => 
     { 
          //This function allows you to adjust the value before it is added to the DOM. Adding markup is a common usage of this function.
        
          //return a valid value (string or number) that you would like to see displayed on the bound target element.
          return '<em>' + value + '</em>';
     };
     let objectAssignmentFunction = (value) => 
     { 
          //If you bound to an input, this function allows you to adjust the value before it is assigned to the object property.
          //Stripping display characters like "$" or converting a string into a date object are common usages of this function.

          //return a valid value to be assigned to the object's property.
          return new Date(value);
     };
     //all of these handler functions are optional.

     let binding = new PropertyBinding('foo', $myInputElement, afterEventFunction, domTransformFunction, objectAssignmentFunction);
     let secondFooBinding = new PropertyBinding('foo', $aSection);
     let subObjectBinding = new PropertyBinding('description', $someDiv);

     let boundObject = PropertyBinder.addBinding(myObject, binding); //the first binding uses the original object and returns a bound object.
     PropertyBinder.addBinding(boundObject, secondFooBinding); //the second binding needs to use the bound object.

     let boundSubObject = PropertyBinder.addbinding(myObject.thisCantBeBound, subObjectBinding); //you'll end up with a second bound object.
     boundObject.thisCantBeBound = boundSubObject; //as far as I know, this will put the sub object on the main bound object. But I haven't tested this. Not sure what the use case for it would be?

     let arrayDomTransform = (value) => { return `<option value="value.toLowerCase()">${value}</option>`; };
     let arrayBinding = new PropertyBinding('favorites', $mySelectElement, afterEventFunction, arrayDomTransform);
     PropertyBinder.addBinding(boundObject, arrayBinding); //array binding is a LITTLE different because it triggers the domTransformFunction on every single element, rather than the entire array. This lets you bind the array to a list or a select, and control how the elements will be created.

     boundObject.foo = 'something new!'; //updates the object and the targeted DOM elements, as well as triggers any events in the bindings.
     boundObject.favorites.push('steak'); //if an array is bound, any function that updates the array (push/splice/unshift/etc), will update the object/DOM and trigger the events.
     ```

     `addBinding` also has three optional params: `setValue`, `bindInput`, and `inputEventName`.
      - `setValue` determines whether you want the binding to set the value of the property to the same value that it was on the referenced object. This will trigger the DOM updates and the binding events. The default value is `true`.
      - `bindInput` determines whether you want two-way binding. If your binding has a target element that is an input, the `addBinding` function will try to add an event listener to that input. When the input's listener is triggered, the binding will update the object. If you don't want this to occur, but you DO want to make the input display the contents of the object property, set this to `false`. The default value is `true`.
      - `inputEventName` is the name of the event that will trigger a bound input to set the object property. The default value is `change`. This means that any input that is passed in should adjust the bound object's properties any time a "change" event occurs. Obviously, you can replace that string with any valid listener string, like `input` in order to adjust when the inputs trigger object changes.
   - `addBindings(object, bindings)` adds an array of bindings to the referenced object. It also returns the bound object, once all bindings have been added. This is a very limited helper function and not particularly useful in most cases. But it's there if you need it!

 - `PropertyBinding` defines the property, target, and events.

# Helpers
All helpers are internal and should not be neccesary for using this library.

# Dependencies
The only dependency `PropertyBinder` relies on is the "micro" version of [LoudArray](https://github.com/the1076/loud-array), in order to handle array changes.
The `property-binder.dependencies.js` file includes this dependency, but if you are already using the `LoudArray` library, just point the import statement to your `LoudArray` path.