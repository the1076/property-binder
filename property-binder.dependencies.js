export class PropertyBinder
{
    static addBindings(object, bindings, setValues = true)
    {
        let boundObject = PropertyBinder.addBinding(object, bindings[0], setValues);
        for(let i = 1; i < bindings.length; i++)
        {
            let binding = bindings[i];
            PropertyBinder.addBinding(boundObject, binding, setValues);
        }
        return boundObject;
    }
    static addBinding(object, binding, setValue = true, bindInput = true, inputEventName = 'change')
    {
        _validateBindingParameters(object, binding);

        let currentValue = object[binding.propertyName];
        let targetObject = object;
        if(!(object instanceof BoundObject))
        {
            targetObject = new BoundObject();
            Object.assign(targetObject, object);
        }
        if(targetObject.__encapsulation == null)
        {
            targetObject.__encapsulation = {};
        }

        if(targetObject.__encapsulation[binding.propertyName] == null)
        {
            targetObject.__encapsulation[binding.propertyName] = {value: null, bindings: [binding] };
        }
        else
        {
            targetObject.__encapsulation[binding.propertyName].bindings.push(binding);
            if(setValue !== false)
            {
                targetObject[binding.propertyName] = currentValue;
            }
            if(bindInput == true)
            {
                _addInputListener(targetObject, binding, inputEventName);
            }
            return targetObject;
        }

        delete targetObject[binding.propertyName];
        if(Array.isArray(currentValue))
        {
            if(!(currentValue instanceof LoudArray))
            {
                currentValue = new LoudArray([{event: 'all', handler: (array, args) => { _array_onChange(targetObject.__encapsulation[binding.propertyName].bindings, array); }}], ...currentValue);
            }
        }

        Object.defineProperty(targetObject, binding.propertyName, 
        {
            enumerable: true,
            set: function (value) 
            {
                let returnValue = targetObject.__encapsulation[binding.propertyName].value = value;

                let objectBindings = targetObject.__encapsulation[binding.propertyName].bindings
                for(let i = 0; i < objectBindings.length; i++)
                {
                    let objectBinding = objectBindings[i];
                    objectBinding.onAfterSet(value);
                    if(targetObject.__updatingFromDOM !== objectBinding.$element)
                    {
                        _updateDom(objectBinding.$element, objectBinding.domDisplayParser, value);
                    }
                }
                return returnValue;
            },
            get: () =>
            {
                return targetObject.__encapsulation[binding.propertyName].value;
            }
        });

        if(setValue !== false)
        {
            targetObject[binding.propertyName] = currentValue;
        }

        if(bindInput == true)
        {
            _addInputListener(targetObject, binding, inputEventName);
        }

        return targetObject;
    }

    static addCollectionBinding(object, binding)
    {

    }

    static addArrayToGroupBinding(object, propertyName, targets)
    {
        if(!(object[propertyName] instanceof Array))
        {
            throw new Error('The target property must be an instance of an Array.');
        }
    }
}

export class PropertyBinding
{
    constructor(propertyName, target, onAfterSet, domDisplayParser, objectAssignmentParser)
    {
        this.propertyName = propertyName;

        this.$element = _getElementFromTarget(target);

        this.onAfterSet = onAfterSet;
        if(this.onAfterSet == null)
        {
            this.onAfterSet = (value) => { return value; };
        }

        this.domDisplayParser = domDisplayParser;
        if(this.domDisplayParser == null)
        {
            this.domDisplayParser = (value) => { return value; };
        }

        this.objectAssignmentParser = objectAssignmentParser;
        if(this.objectAssignmentParser == null)
        {
            this.objectAssignmentParser = (value) => { return value; };
        }
    }
}
export class CollectionBinding
{
    constructor(propertyName, target, onAfterSet, domDisplayParser, collectionAssignmentParser)
    {
        this.propertyName = propertyName;
        if(Array.isArray(target))
        {
            this.type = CollectionType.ToggleGroup;
            this.$elements = _getElementsFromTarget(target);
        }
        else
        {
            this.$element = _getElementFromTarget(target);
            if(collectionTagNames.indexOf(target.tagName) == -1)
            {
                throw new Error('The collection binding target must be an array of toggle elements (checkbox or radio Inputs), a Select element or a List (ol, ul, dl) element.');
            }
            this.type = collectionTypeMap[this.$element.tagName];
        }

        this.onAfterSet = onAfterSet;
        if(this.onAfterSet == null)
        {
            this.onAfterSet = (value) => { return value; };
        }

        this.domDisplayParser = domDisplayParser;
        if(this.domDisplayParser == null)
        {
            this.domDisplayParser = (value) => { return value; };
        }

        this.collectionAssignmentParser = collectionAssignmentParser;
        if(this.collectionAssignmentParser == null)
        {
            this.collectionAssignmentParser = (value) => { return value; };
        }
    }
}

class BoundObject { }
class BoundCollection { }
class CollectionType { static get ToggleGroup() { return 'toggle-group'; } static get Select() { return 'select'; } static get List() { return 'list'; } }

var formTagNames = ['INPUT', 'SELECT', 'TEXTAREA'];
var valueNodeType = ['INPUT', 'SELECT', 'TEXTAREA'];
var collectionTagNames = ['DL', 'OL', 'UL', 'SELECT'];
var collectionTypeMap = { SELECT: CollectionType.Select, OL: CollectionType.List, UL: CollectionType.List, DL: CollectionType.List}

function _validateBindingParameters(object, binding)
{
    if(object == null)
    {
        throw new Error('The object to bind cannot be null.');
    }
    if(!(binding instanceof PropertyBinding))
    {
        throw new Error('The binding value must be of type "PropertyBinding"');
    }
}
function _getElementsFromTarget(targets)
{
    let elements = targets.map((value) =>
    {
        let input = _getElementFromTarget(value);
        if(input.tagName !== 'INPUT' || (input.type !== 'checkbox' && input.type !== 'radio'))
        {
            throw new Error('Elements supplied for ToggleGroup collections must be input elements and must be of either the type "checkbox" or "radio".');
        }
        return input;
    });
    return elements;
}
function _getElementFromTarget(target)
{
    let element;
    if(Object.prototype.toString.call(target) !== '[object String]')
    {
        if(target instanceof HTMLElement)
        {
            element = target;
        }
        else
        {
            throw new Error('"target" property must be either an HTMLElement or a string value.');
        }
    }
    else
    {
        element = document.querySelector(target);
    }

    if(element == null)
    {
        throw new Error(`Could not find target element from the supplied value: ${target}`);
    }
    return element;
}
function _array_onChange(bindings, array)
{
    for(let i = 0; i < bindings.length; i++)
    {
        let objectBinding = bindings[i];
        objectBinding.onAfterSet(array);
        _updateDom(objectBinding.$element, objectBinding.domDisplayParser, array);
    }
}
function _updateDom(target, domDisplayParser, value)
{
    if(value instanceof Array)
    {
        let htmlArray = [];
        for(let i = 0; i < value.length; i++)
        {
            let arrayElement = value[i];
            let text = domDisplayParser(arrayElement);
            htmlArray.push(text);
        }
        value = htmlArray.join('');
    }

    let operation = 'innerHTML';
    if(valueNodeType.indexOf(target.nodeName) > -1)
    {
        operation = 'value';
        if(target.type === 'checkbox' || target.type === 'radio')
        {
            operation = 'checked';
        }
    }
    target[operation] = value;
}
function _addInputListener(targetObject, binding, inputEventName)
{
    if(formTagNames.indexOf(binding.$element.tagName) > -1)
    {
        binding.$element.addEventListener(inputEventName, (event) =>
        {
            let input = event.currentTarget;
            let inputValue = input.value;
            if(input.type == 'checkbox' || input.type == 'radio')
            {
                inputValue = input.checked;
            }
            let transformedValue = binding.objectAssignmentParser(inputValue);

            targetObject.__updatingFromDOM = input;
            targetObject[binding.propertyName] = transformedValue;
            delete targetObject.__updatingFromDOM;
        });
    }
}

//dependencies
class LoudArray extends Array{constructor(listeners,...fromValues){if(super(...fromValues),!Array.isArray(listeners))throw new Error('The "listeners" property must be an array.');this._private={listeners:listeners||[]};const mutatorMethods="copyWithin fill pop push reverse shift sort splice unshift".split(" ");for(let i=0;i<mutatorMethods.length;i++){let method=mutatorMethods[i];this._private[method]=this[method].bind(this),this[method]=(...args)=>{let listeners=this._private.listeners.filter(value=>{if("copyWithin"===method&&"copy-within"==value.event)return!0;let event=value.event.toLowerCase();return event==method||"any"==event||"all"==event}),returnValue=this._private[method](...args);return _dispatchEvents(this,listeners,"after",args),returnValue}}this._private.slice=this.slice.bind(this),this.slice=(...args)=>{let returnValue=this._private.slice(...args);return returnValue=new Array(...returnValue)}}addEventListener(event,handler){let listenerIndex=_array_findListener(this,listener.event,listener.handler);return listenerIndex>-1?this._private.listeners[listenerIndex]:(this._private.listeners.push({event:event,handler:handler}),listener)}removeEventListener(event,handler){let listenerIndex=_array_findListener(this,event,handler);-1!=listenerIndex&&this._private.listeners.splice(listenerIndex,1)}}function _array_findListener(target,event,handler){let index=-1;for(let i=0;i<target._private.listeners.length;i++){let listener=target._private.listeners[i],listenerEvent;if(listener.event.toLowerCase()==event&&listener.handler==handler){index=i;break}}return index}function _dispatchEvents(target,listeners,args){for(let i=0;i<listeners.length;i++){let listener;listeners[i].handler(target,...args)}}