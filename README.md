# Express transformer [![Build Status](https://travis-ci.org/tranvansang/express-transformer.svg?branch=master)](https://travis-ci.org/tranvansang/express-transformer)
[![NPM](https://nodei.co/npm/express-transformer.png)](https://nodei.co/npm/express-transformer/)

Connect-like middleware to validate/transform data.

This library helps you easier to get along with writing express validation/transformation middlewares,
be more confident to implement your business logic without worrying about the data's validity.

# Usage samples

- Ensure a value exist.
```javascript
import express from 'express'
import {transformer} from 'express-transformer'

const app = express()
app.use('/login',
	transformer('username').exists(),
	transformer('password').exists(),
	(req, res, next) => {
	//req.body.age and req.body.password must exist, for sure
	})
app.listen(3000)
```

- Check passwords be the same.
```javascript
import express from 'express'
import {transformer} from 'express-transformer'

const app = express()
app.use('/signup',
	transformer('username').exists(),
	transformer('password').exists(),
	transformer(['password', 'passwordConfirm']).transform(([password, passwordConfirm]) => {
        if (password !== passwordConfirm) throw new Error('Passwords do not match')
    }, {validateOnly: true}),
	(req, res, next) => {
	//req.body.age and req.body.password exist
    //and, req.body.password === req.body.passwordConfirm
	})
app.listen(3000)
```

- Convert 1-base `page` parameter in query to a 0-base number.
```javascript
app.use('/article',
	transformer('page', {location: 'query'})
		.defaultValue(1)
		.toInt({min: 1})
		.transform(val => val - 1),
	(req, res, next) => {
	})
```

- Check password length, validate email.
More complicated, but obviously common case.
```javascript
app.use('/signup',
	transformer('email')
		.exists()
        .message('Please provide email')
		.isLength({min: 8}) //note that .exists() is required because if value is omitted, transformer will not be triggered
        .message('Email is too short')
		.transform(async email => { // transformer can be async function
			const existingUser = await User.findByEmail(email).exec()
			if (existingUser) throw new Error('Email already existed')
		}, {validateOnly: true}),
	transformer(['password', 'passwordConfirm'], {validateOnly: true})
		.exists()
		.trim()
		.isLength({min: 8})
		.transform(([password, passwordConfirm]) => {
			if (password !== passwordConfirm) throw new Error('Passwords do not match')
		}),
	(req, res, next) => {}
)
```

- Convert an id to a user object.
```javascript
app.use('/get-user/:id',
	transformer('email', {location: 'params'})
		.exists()
        .message('Please provide id')
		.transform(async id => { // transformer can be async function
			const user = await User.findById(id).exec()
			if (user) throw new Error('In correct id')
            return user //req.params.id will become this object
		}),
	(req, res) => {res.status(200).json(req.params.id.toJSON())}
)
```

# Usage

The library exports following methods and objects
- `transformer`
- `addTransformerPlugin`
- `recursiveGet`
- `recursiveSet`
- `recursiveHas`

Typically, you only need to use the `transformer()` method in most of the cases.
This method returns a transformations chain which is used to validate/transform input data.
The transformations chain is also a connect-like middleware, and can be placed in the handler parameter in express (e.g. `app.use(chain)``).

A transformation/validation can be appended to a transformations chain by calling `chain.<method>`.
Basically, the library only defines two methods in a transformations chain, namely `.message()` and `.transform()`.

`addTransformerPlugin` is used to add custom methods as transformers/validators.
Initially, the library adds various plugins for uses, in advance. Such as: `.isEmail`, `.exists`, `.defaultValue`, `.toInt`, ...
Check the Plugins section below for more information.

All methods from any transformations chain, including the methods defined by plugins and the default basic methods (`.message()`, `.transform()`), always return the chain itself.
It is possible and recommended adding transformations to the chain by **chain**ing method calls.
For example: `chain.exists().isEmail().transform(emailToUser).message('Email not found')`

# API references

## Create a transformations chain
`transformer: (path, transformerOptions) => chain`
- Parameters:
    - `(required) path: string | string[]`: a *universal-path* formatted string or an array of *universal-path* formatted string.
    
        Sample values: `'email'`, `'foo[]'`, `['foo', 'bar']`, `['foo[]', 'foo[].bar.baar[]', 'fooo']`.
    - `(optional) transformerOptions: Object`: an object with the following properties.
        - `(optional) location: string (default: 'body')`: a *universal-path* formatted string, which specifies where to find the input value from the `req` object.
- Returned value: a connect-like middleware which inherits all methods from transformations chain's prototype.

## Transformation chain
A transformation chain has the following methods.

This methods list can be extended via `addTransformerPlugin`.
Associated Typescript typing extend is also available.

- `chain.transform(callback, options)`: append a custom transformation/validation to the chain.
    - Parameters:
        - `(required) callback: (value, info) => any | Promise<any>`: the callback of the transformation/validation.
        The callback can be an async or a normal function, which should accept the following parameters.
            - `value`: value or array of values
                - If the `path` parameter in `transformer(path, transformerOptions)` is a string, `value` will be the value of the current input.
                - If the `path` parameter in `transformer(path, transformerOptions)` is an array of string, `value` will be array of the values of the list of current inputs.
            - `info: Object`: an object which includes the following properties.
                - `path`: path to the current input or array of paths to the current list of inputs.
                - `req`: the request `req` object from the connect-like middleware.
                - `options: Object`: the `transformerOptions` object passed in `.transform(callback, transformerOptions)` with default fields (i.e., the `location` field) filled.
                
                    Note: this `options` object is always a non-null object, with `options.location` reflects the currently being used value of the `location` config.
                    Which means, for e.g., if `transformerOptions` is `undefined`, `options` will be `{location: 'body'}`.
                    If `transformerOptions` is `{foo: 'bar'}`, `options` will be `{location: 'body', foo: 'bar'}`.
                    If `transformerOptions` is `{foo: 'bar', location: 'params'}`, `options` will be `{location: 'params', foo: 'bar'}`.
        - `(optional)options: Object`: an optional option object with the following properties.
            - `(optional) force: boolean (default: false)`: when the input value is omitted, the transformation will be skipped.
            
                Note 1: the library uses `Object.hasOwnProperty()` to determine whether a value at path exists, which means even if you specify `undefined` at the path, the transformation is **not** skipped.
            
                Note 2: if `force` is `true` and {`path` or element in `path`} includes an array notation (`[]`), the necessary updates will occur along path traversal to make sure the access to the end of the path possible.
                This behavior ignores the value of `validateOnly`.
                
                For example: With `path = 'foo.bar[].fooo.baar[]'`, `context = {}`, `context` will be updated to be `{foo: {bar: []}}`.
                With `path = 'foo.bar[].fooo.baar[]'`, `context = {foo: {bar: 0}}`, `context` will be updated to be `{foo: {bar: []}}` (because `Array.isArray(0)` is `false`, the library overwrites it with `[]`).
            - `(optional) validateOnly: boolean (default: false)`: keep the value unchanged after the transformation. In other words, this config specifies whether the transformation is a transformer (check and change the value) or a validator (only check).

            *Note 1*: when `force` is `false`, and `path` is an array of string, the following rules are applied (and overwriting the default behavior).
            - If **all of** value specified by `path` do not exist, skip the transformation (respecting the value of `force`).
            - If **at least one** value specified by `path` exists, `force` is forced to be `true`. And the `info` param in the transformation `callback` will have the forced value.
    - Returned value: the chain itself
- `chain.message(callback, option)`: overwrite the error message of the one or more previous transformations in the chain.
    - Parameters:
        - `(required) callback: Function | string`: the string indicating the message or the function which accepts the same parameters as of `chain.transform()`'s `callback` (i.e., `value` and `info`).
        Similarly, `callback` can be async or a normal function.
        - `(optional) option: Object`: an object specifying the behavior of the overwriting message, which includes the following properties.
            - `(optional) force: boolean (default: false)`:
                - if `force` is `true`: overwrite the error message of all transformations in the chain, which does not have error message overwritten, from begin until when this message is called.
                
                Note: the error message of the most recent transformation will be overwritten even if it exists, regardless of the value of `force`.
                If two consecutive messages are provided, the latter is preferred (with a configuration `console.warn`'s message).
    - Returned value: the chain itself

## Plugins

Initially, the library adds these chain plugins (by calling `addTransformerPlugin` internally).

In these plugin config, mostly, when the `force` option exist, it indicates the `force` config in the transformation.

### Validators:

These plugins only validate, does not change the inputs in the paths. In other words, they have `validateOnly` be `false`.
- `chain.exists({acceptEmptyString = false} = {})`: invalidate if the input is `undefined`, `null`, `''` (empty string), or omitted.
    If `acceptEmptyString` is `true`, empty string is accepted as valid.
- `chain.isEmail(options)`: check if the input is a string and in email format.

    `options` is an optional object with the following properties

    - `force?: boolean`
	- `allowDisplayName?: boolean`
	- `requireDisplayName?: boolean`
	- `allowUtf8LocalPart?: boolean`
	- `requireTld?: boolean`
	- `ignoreMaxLength?: boolean`
	- `domainSpecificValidation?: boolean`
	- `allowIpDomain?: boolean`
	
	Please consult the [validator](https://www.npmjs.com/package/validator) package for more details.
- `chain.isIn(values, options?: {force?: boolean})`: check if the input is in the provided `values` list.
- `chain.isLength(options, transformOptions?: {force?: boolean})`: check the input's length.
    If the input is an array, check for number of its elements.
    Else If the input is a string, check for its length.
    Otherwise, throw an error.
    
    The `options` object can be a number (in number or in string format), or an object of type `{min?: number, max?: number}`.
    If `options` is a number, the transformation fixes the input's length.
    Otherwise, it validates the length by `min`, `max`, if the option exists, accordingly.
- `chain.matches(regex, options?: {force?: boolean})`: check if the input is a string and matches a regex.

### Transformers:

These plugins probably change the inputs in the paths. In other words, they have `validateOnly` be `true`.

- `chain.defaultValue(defaultValue)`: change the input to `defaultValue` if `value` is `undefined`, `null`, `''` (empty string), or omitted.
- `chain.toDate(options?: {resetTime?: boolean, force?: boolean})`: convert the input to a `Date` object.
    Throw an error if the input is not a number, not a string, not a Date object.
    Otherwise, check if the input can be converted to a valid Date object.
    
    When `resetTime` is `true`, reset `hour`, `minute`, `second`, and `milisecond` to zero.
- `chain.toFloat(options?: {min?: number, max?: number, force?: boolean})`: convert the input to a number.
    Throw an error if the input is a valid number or cannot be parsed to a number.
    Support range checking with the `min`, `max` in the options.
- `chain.toInt(options?: {min, max, force})`: convert the input to an integer number.
    Throw an error if the input is a valid number or cannot be parsed to an integer number.
    Support range checking with the `min`, `max` in the options.
- `chain.trim()`: trim value if it exists and is in string format. This transformer never throws any error.

## How to add a plugin

You can add your own plugin via calling `addTransformerPlugin`. For example: `isUUID`, `isPostalCode`, `isCreditCard`, ...

Consult the [validator](https://www.npmjs.com/package/validator) package for more validators.

`addTransformerPlugin` accepts only one object presenting the plugin configuration, which should include the following properties.

- `(rquired) name: string`: the name of the plugin. Like: `isPostalCode`.
- `(required) getConfig: Function`: a function accepting any parameters which are the parameters provided to the plugin call (for e.g., `chain.isPostalCode(...params)`).
     . This function should return an object including the following properties.
    - `(required) transform: Function`: a function which accepts the same parameters as of `chain.transform`.
    - `(optional) options: Object`: the options object which will be passed to `.transform()`.
     It is highly recommended to set `validateOnly` option here to explicitly indicate that your plugin is a validator or a transformer.
     
It is recommended to make use of the exported `TransformationError` error when throwing an error.

### How to extend the Typescrript typing.

The transformations chain's interface can be exported via namespace and global declaration like below.

```typescript
declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			isPostalCode(
				value: T,
				options?: {force?: boolean}
			): ITransformer<T, string, Options>
		}
	}
}
```

## Utility functions

Coupled with the universal-path string format, there are 3 utility functions which are used internally to manipulate the context object.

`import {recursiveGet, recursiveHas, recursiveSet} from 'express-transformer`

These 3 methods are designed to **just work**, and **never** through any error with an arbitrary `context` parameter.

All `path` parameters are in universal-path string format.

These methods use `Object.hasOwnProperty` to check if a key exists in an object.
Therefore, if the key is defined with an `undefined` value, it is considered as existing.

- `recursiveGet(context, path, defaultValue)`: get the value at `path`, return `defaultValue` if not exist.
- `recursiveSet(context, path, value)`: set the `value` at `path`.
At a point in the traversal path, if the value is not eligible for writing the value, it will reset the value at that path to be `{}`.
For example, calling on `{foo: 0}`, with `path = 'foo.bar.baar'`, `value = 1`, will make the context object be `{foo: {bar: {baar: 1}}` (`0` is removed).
- `recursiveHas(context, path)`: check if there is a value at `path`.

## Error class

`import {TransformationError} from 'express-transformer'`

- If a transformation has an associated message, the error message is wrapped in an `TransformationError` object instance.
Otherwise, the error thrown by the callback in `.transform(callback)` is thrown.
- All default plugins use and throw only `TransformationError` error.
- The error's detailed information can be accessed by `error.info`, which is the `info` object passed to the `.transform()`'s `callback`.

- API: `constructor(message: string, info: ITransformCallbackInfo)`

# Annotations explanation

## Universal path format
A versatile string which support accessing value at any deep level and array iteration.

Giving a context object `obj`. The following `path` values make the library to looks at the appropriate location in the context object.

- For example, if `path` is `'foo.bar'`, the library will look at `obj.foo.bar`.
- If `path` contains `[]`, the library will iterate all value at the path right before the `[]`'s occurrences.
- For example, if `path` is `foo[].bar.foo.baar[]`, the library will look at `obj.foo[0].bar.foo.baar[0]`, `obj.foo[1].bar.foo.baar[0]`, `obj.foo[2].bar.foo.baar[0]`, `obj.foo[0].bar.foo.baar[1]`.

## Array of arrays validation

This library is very useful if you want to validate/transform every element in an array, or every pair of elements between many arrays.

To indicate an array iteration, use the `[]` notation in the `path` value.

Let's see by examples:

- If `path` is `'foo[].bar.baar[]'`, the library will do the following
    - Travel to `req.body.foo`, if the current value is an array, iterator through all elements in the array.
    On each element, go deeper via the path `bar.baar`.
    - At `bar.baar` of the children object, iterate through all values in the array, pass it to the transformer callback.
    - If `validateOnly` is `false`, replace the value by the result returned from the callback (`Promise` returned value is also supported).
    
- If `path` is an array. Things become more complicated.

Base on the common sense, we **decided** to manually force the validation (ignoring the value of `force` when needed), to avoid several use cases.
Assume that you want to make an API to change user password. There are following requirements which the API should satisfy.

- If `password` and `passwordConfirm` are omitted, skip changing the password (, and may change other provided values).
- If `password` or `passwordConfirm` are provided, check if they equal with some condition (length, ...etc) before process the changing.

`transformer(['password', 'passwordConfirm']).transform(callback)` is designed to do that for you.

- The most useful path of the array of arrays validation, is that if there are multiple elements in the `path` object (which is an array of `string`) have the array notation (`[]`),
the library will pair them one by one, and pass their values in a list and call the `callback`.
The library also replaces the returned values in the corresponding locations, if `validateOnly` is `false`.
Accordingly, when `validateOnly` is `false` and `path` is an array, the `callback` is required to return an array.
 
# QA

Q1. How do I customize the error handler?
A1. Place your own error handler and check the error with `instanceof`

```
app.use(transformer().transform(), (err, req, res, next) => {
    if (err instanceof TransformationError) {
        console.log(err.info)
    }
    //...
})
```

## Change logs

See [change logs](./change-logs.md)
