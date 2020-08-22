# Express transformer [![Build Status](https://travis-ci.org/tranvansang/express-transformer.svg?branch=master)](https://travis-ci.org/tranvansang/express-transformer)
[![NPM](https://nodei.co/npm/express-transformer.png)](https://nodei.co/npm/express-transformer/)

Connect-like middleware to validate/transform data.

# Table of contents

- [Usage samples](#usage-samples)
- [Usage](#usage)
- [API References](#api-references)
    - [Create a transformation chain](#create-a-transformation-chain)
    - [Transformation chain](#transformation-chain)
    - [Plugin](#plugins)
        - [Validators](#validators)
        - [Transformers](#transformers)
    - [How to add a custom plugin](#how-to-add-a-custom-plugin)
        - [How to extend the Typescript typing.](#how-to-extend-the-typescript-typing)
    - [Utility functions](#utility-functions)
    - [Error class](#error-class)
- [Annotations explanation](#annotations-explanation)
    - [Universal path format](#universal-path-format)
    - [Array of arrays iteration](#array-of-arrays-iteration)
- [QA](#qa)

This library helps you more comfortable to get along with writing express validation/transformation middlewares,
be more confident to implement your business logic without worrying about the data's validity.

# Usage samples

- Ensure a value exists.
```javascript
const express = require('express')
const {transformer} = require('express-transformer')

const app = express()
app.post('/login',
	transformer('username').exists(),
	transformer('password').exists(),
	(req, res, next) => {
        //req.body.age and req.body.password must exist, for sure
	})
app.listen(3000)
```

- Check passwords be the same.
```javascript
const express = require('express')
const {transformer} = require('express-transformer')

const app = express()
app.post('/signup',
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

- Convert the 1-base `page` parameter in the query to a 0-base number.
```javascript
app.get('/article',
	transformer('page', {location: 'query'})
		.defaultValue(1)
		.toInt({min: 1})
		.transform(val => val - 1),
	(req, res, next) => {
	})
```

- Check password length and validate email format, a more complicated, but obviously common case.
```javascript
app.post('/signup',
	transformer('email')
		.exists() //.exists() is required because if the input is omitted, the transformers will not be triggered
        .message('Please provide email')
		.isLength({min: 8})
        .message('Email is too short')
		.transform(async email => { // transformer function can be async
			const existingUser = await User.findByEmail(email).exec()
			if (existingUser) throw new Error('Email already existed')
		}, {validateOnly: true}),
	transformer(['password', 'passwordConfirm'], {validateOnly: true})
		.exists()
		.trim()
		.isLength({min: 8})
		.transform(([password, passwordConfirm]) => {
			if (password !== passwordConfirm) throw new Error('Passwords do not match')
        }, {validateOnly: true}),
	(req, res, next) => {}
)
```

- Convert an id to a user object.
```javascript
app.get('/get-user/:id',
	transformer('email', {location: 'params'})
		.exists()
        .message('Please provide id')
		.transform(async id => {
			const user = await User.findById(id).exec()
			if (user) throw new Error('In correct id')
            return user //req.params.id will become the `user` object
		})
        .message(async id => { // the message function can be async
            return `${id} is not a valid user id`
        }),
	(req, res) => {res.status(200).json(req.params.id.toJSON())}
)
```

- Array iteration
```javascript
transformer('user.messages[].stars[]').toInt({min: 0, max: 5})
```

- Array of arrays iteration
```javascript
transformer(['me.favorites[]', 'posts[].meta.comments[].likes[]', 'credits'])
  .transform(([favorite, like, credits]) => {
    // perform the check here
    // when validateOnly is true, the returned value will be ignored
  }, {validateOnly: true})
```

- Conditional transformation/validation
```javascript
app.post(
    '/order/:id',
    (req, res, next) => {
        // if rejected is true, must provide reason
        if (req.body.rejected) transformer('reason').exists()(req, res, next)
        else next()
    }
)
```

- Conditioning with multiple transformation/validation
```javascript
const {combineMiddlewares} = require('middleware-async')

app.post(
    '/order/:id',
    transformer('action').exists().isIn(['review',  'return']),
    (req, res, next) => combineMiddlewares(
        req.body.action === 'review'
            ? [
                transformer('stars').exists(),
                transformer('id').transform(idToOrder),
                transformer('comment')
                    .exists()
                    .message((_, {req}) => `Plesae provide comment on your review on the order of "${req.params.id.product.name}", created at ${req.params.id.createdAt.toLocaleString()}`)
            ]
            : transformer('reason').exists()
    )(req, res, next)
)
```

- Add your own custom method via plugins.
```javascript
const {addTransformerPlugin} = require('express-transformer')

addTransformerPlugin({
    name: 'isPostalCode',
    getConfig() {
        return {
            transform(value, info) {
                if (typeof value !== 'string') throw new Error(`{info.path} must be a string`)
                if (!/^\d{3}-\d{4}$/.test(value)) throw new Error(`${info.path} is a valid postal code`)
            },
            options: {
                validateOnly: true
            }
        }
    }
})

app.post(
    '/change-address',
     transformer('postalCode').exists().isPostalCode()
)
```

Extend the Typescript typing.

```typescript
declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			isPostalCode(): ITransformer<T, string, Options>
		}
	}
}
```

- Add your own custom method via plugins for batch operation, with options.
```javascript
const {addTransformerPlugin, TransformationError} = require('express-transformer')

addTransformerPlugin({
    name: 'allExist',
    getConfig(options) {
        return {
            transform(values, info) {
                if (values.some(value => value === null || value === undefined || (!options.acceptEmptyString && value === ''))) {
                    throw new TransformationError(`All paths (${info.path.join(', ')}) must be provided`, info)
                }
            },
            options: {
                validateOnly: true
            }
        }
    }
})

app.post(
    '/signup',
     transformer(['username', 'password', 'first', 'last']).allExist({acceptEmptyString: false})
)
```

- Combine multiple transformations by plugin name.
```javascript
app.post(
    '/update',
    transformer('first').use([
        ['exists'],
        ['isType', 'string'],
        ['isLength', {max: 50}],
    ]),
    transformer('postalCode').use([
        ['exists'],
        ['isType', 'string'],
        [postalCode]
    ]),
)
```

- Combine multiple transformations using a plugin object.

```javascript
const isPostalCode = {
    name: 'isPostalCode',
    getConfig() {
        return {
            transform(value, info) {
                if (typeof value !== 'string') throw new Error(`{info.path} must be a string`)
                if (!/^\d{3}-\d{4}$/.test(value)) throw new Error(`${info.path} is a valid postal code`)
            },
            options: {
                validateOnly: true
            }
        }
    }
}
app.post(
    '/update',
    transformer('postalCode').use([
        ['exists'],
        ['isType', 'string'],
        [isPostalCode],
    ])
)
```

All default plugins are exported and available to be used in this way (or you can use their names instead).

```
const {
	transform,
	exists,
	isIn,
	isEmail,
	isLength,
	matches,
	toDate,
	toFloat,
	toInt,
	trim,
	defaultValue,
	is,
	isArray,
	isType,
	use
} = require('express-transformer')
```

Note: `.message`is not a plugin.

You can save the configuration to reuse.

```
const requiredString = len => [
    ['exists'],
    ['isType', 'string'],
    ['isLength', {max: len}],
]
app.post('/update',
    transformer('first').use(requiredString(50)),
    transformer('last').use(requiredString(50)),
    transformer('introduction').use(requiredString(256)),
)
```

- How to use the `.message` in this a combination?

Unfortunately, `.message` is not yet a plugin.
Because it requires internal access to overwrite the configuration of the previous transformations in the chain.
Recklessly changing the internal to make this available is unnecessary for now, and it would reduce the library's flexibility in future development.

Workaround.

```javascript
const combineChains = (path, chains) => chains.reduce(
    (acc, [name, ...params]) => acc[name](...params),
    transformer(path)
)

app.post('/update', combineChains('first', [
    ['exists'],
    ['message', 'Please enter your first name'],
    ['isType', 'string'],
    ['message', 'first must be a string element'],
    ['isLength', {max: len}],
    ['message', 'first is too long'],
    ['transform', value => value.toUpperCase()]
]))
```

- **This library is built with a strict requirement in mind,
it should work in almost any condition with almost any malformed input data**

*If you find this is not correct, please fire a bug issue.*

Once the input data passes all transformations/validations, you can freely use the value specified by path at any depth level.

For example, with `transformer('review.stars').exists().toInt()`, in all handlers following after,
you can freely use `req.body.review.stars` without worrying about what the input was initially.

For instance, if the input was `req = {body: {review: 'foo'}}`, calling `req.body.review.stars` without checking will
throw an error, and may break your app.
However, the transformation automatically detects the pattern you require and changes the value for you.

- Another malformed input data pattern.

Consider the input with the data `req = {body: {reviews: {0: {stars: 7}}}}`, and the transformer `transformer('reviews[].stars').exists()`, 
Without the transformer, there will be no error when accessing `req.body.reviews[0].stars`.

However, because array notation is specified after `reviews` key, the input is reset to an empty array, and becomes `{reviews: []}`.

- And more ready-to-use validators/transformers, namely:
    - `.exists()`
    - `.is(value)`
    - `.isArray()`
    - `.isEmail()`
    - `.isIn(list)`
    - `.isLength()` (check string length or array's length)
    - `.isType(type)`
    - `.matches(regex)`
    - `.defaultValue(value)`
    - `.toDate()`
    - `.toFloat()`
    - `.toInt()`
    - `.trim()`
    - `.use()` (combine multiple transformations)

Plugins with extendable Typescript typing can be configured to add new methods permanently.

# Usage

The library exports the following methods and objects
- `transformer` (also exported as `default`)
- `addTransformerPlugin`

Typically, you only need to use the `transformer()` method in most of the cases.
This method returns a transformation chain that is used to validate/transform input data.
The transformation chain is also a connect-like middleware, and can be placed in the handler parameter in express (e.g. `app.use(chain)``).

A transformation/validation can be appended to a transformation chain by calling `chain.<method>`.
Actually, the library only defines only one method in the transformation chain's prototype, namely `.message()`.
All other methods are added using `addTransformerPlugin`.

Initially, the library adds various plugins for uses, in advance.
Such as: `.transform`, `.isEmail`, `.exists`, `.defaultValue`, `.toInt`, ...
Check the Plugins section below for more information.

All methods from any transformation chain, including the methods defined by plugins and the internally implemented method (`.message()`), always return the chain itself.
It is possible and highly recommended to add transformations to the chain by **chain**ing method calls.
For example: `chain.exists().isEmail().transform(emailToUser).message('Email not found')`

# API references

## Create a transformation chain
`transformer: (path, transformerOptions) => chain`
- Parameters:
    - `(required) path: string | string[]`: a *universal-path* formatted string or an array of *universal-path* formatted string.
    
        Sample values: `'email'`, `'foo[]'`, `['foo', 'bar']`, `['foo[]', 'foo[].bar.baar[]', 'fooo']`.
    - `(optional) transformerOptions: Object`: an object with the following properties.
        - `(optional) location: string (default: 'body')`: a *universal-path* formatted string, which specifies where to find the input value from the `req` object.
        - `(optional) rawLocation: boolean (default: false)`: treat the `location` value as a single key (i.e., do not expand to a deeper level).
        - `(optional) rawPath: boolean (default: false)`: treat path the exact key without the expansion.
        - `(optional) disableArrayNotation: boolean (default: false)`: disable array iteration (i.e., consider the array notation as part of the key name).
- Returned value: a connect-like middleware that inherits all methods from the transformation chain's prototype.

## Transformation chain
A transformation chain has the following methods.

You can add your own method via `addTransformerPlugin`.
The Typescript typing is also available to be extended.

- `chain.transform(callback, options)`: append a custom transformation/validation to the chain.
    - Parameters:
        - `(required) callback: (value, info) => any | Promise<any>`: the callback of the transformation/validation.
        The callback can be an async or a normal function, which should accept the following parameters.
            - `value`: value or array of values
                - If the `path` parameter in `transformer(path, transformerOptions)` is a string, `value` will be the value of the current input.
                - If the `path` parameter in `transformer(path, transformerOptions)` is an array of string, `value` will be the array of the values of the list of current inputs.
            - `info: Object`: an object which includes the following properties.
                - `path`: the path to the current input or the array of paths to the current list of inputs.
                - `pathSplits`: an array that contains a string (object key) or number (array index) values used to determine the traversal path.
                    When the `path` parameter is an array, this value will be an array of array.
                - `req`: the request `req` object from the connect-like middleware.
                - `options: Object`: the `transformerOptions` object passed in `.transform(callback, transformerOptions)` with default fields (i.e., the `location` field) filled.
                
                    Note: this `options` object is always a non-null object, with `options.location` reflects the currently being used value of the `location` config.
                    Which means, for e.g., if `transformerOptions` is `undefined`, `options` will be `{location: 'body'}`.
                    If `transformerOptions` is `{foo: 'bar'}`, `options` will be `{location: 'body', foo: 'bar'}`.
                    If `transformerOptions` is `{foo: 'bar', location: 'params'}`, `options` will be `{location: 'params', foo: 'bar'}`.
        - `(optional)options: Object`: an optional options object with the following properties.
            - `(optional) force: boolean (default: false)`: when the input value is omitted, the transformation will be skipped.
            
                Note 1: the library uses `Object.hasOwnProperty()` to determine whether a value at path exists, which means even if you specify `undefined` at the path, the transformation is **not** skipped.
            
                Note 2: if `force` is `true` and {`path` or element in `path`} includes an array notation (`[]`), the necessary updates will occur along path traversal to make sure the access to the end of the path possible.
                This behavior ignores the value of `validateOnly`.
                
                For example: With `path = 'foo.bar[].fooo.baar[]'`, `context = {}`, `context` will be updated to be `{foo: {bar: []}}`.
                With `path = 'foo.bar[].fooo.baar[]'`, `context = {foo: {bar: 0}}`, `context` will be updated to be `{foo: {bar: []}}` (because `Array.isArray(0)` is `false`, the library overwrites it with `[]`).
            - `(optional) validateOnly: boolean (default: false)`: keep the value unchanged after the transformation. In other words, this config specifies whether the transformation is a transformer (check and change the value) or a validator (only check).

            *Note 1*: when `force` is `false`, and `path` is an array of string, the following rules are applied (and overwriting the default behavior).
            - If **all of** the values specified by `path` do not exist, skip the transformation (respecting the value of `force`).
            - If **at least one** the values specified by `path` exists, `force` is forced to be `true`.
             And the `info` param in the transformation `callback` will have the forced value.
            
            *Note 2*: when `path` is an array of string, regardless of the value of `force`,
            if there is *any of* path at which there is no data (zero element or no data provided),
            the transformation will be skipped. (zero times of any number is zero).
    - Returned value: the chain itself
- `chain.message(callback, option)`: overwrite the error message of the one or more previous transformations in the chain.
    - Parameters:
        - `(required) callback: Function | string`: the string indicating the message,
        or the function which accepts the same parameters as of `chain.transform()`'s `callback` (i.e., `value` and `info`)
        and returns the string message or a promise which resolves the string message.
        
        When being accessed, if the callback throws an error or returns a projected promise, the transformation chain will throw that error while processing.
        - `(optional) option: Object`: an object specifying the behavior of the overwriting message, which includes the following properties.
            - `(optional) global: boolean (default: false)`:
                - if `global` is `true`: overwrite the error message of all transformations in the chain, which does not have an error message overwritten, from the beginning until when this message is called.
                
                Note: the error message of the most recent transformation will be overwritten even if it exists, regardless of the value of `global`.
                If two consecutive messages are provided, the latter is preferred (with a configuration `console.warn`'s message).
    - Returned value: the chain itself

## Plugins

Initially, the library adds these chain plugins (by calling `addTransformerPlugin` internally).

In these plugins' config, when the `force` option exists, it indicates the `force` config in the transformation.

### Validators:

These plugins only validate, do not change the inputs in the paths. In other words, they have `validateOnly` be `false`.
- `chain.exists({acceptEmptyString = false} = {})`: invalidate if the input is `undefined`, `null`, `''` (empty string), or omitted.
    If `acceptEmptyString` is `true`, empty string is accepted as valid.
- `chain.is(value, options?: {force?: boolean})`: check if the input is value.
- `chain.isArray(options?: {force?: boolean})`: check if the input is an array.
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
    If the input is an array, check for the number of its elements.
    Else If the input is a string, check for its length.
    Otherwise, throw an error.
    
    The `options` object can be a number (in number or in string format), or an object of type `{min?: number, max?: number}`.
    If `options` is a number, the transformation fixes the input's length.
    Otherwise, it validates the length by `min`, `max`, if the option exists, accordingly.
- `chain.isType(type, options?: {force?: boolean})`: check the result of `typeof` of the input value to be `type`.
- `chain.matches(regex, options?: {force?: boolean})`: check if the input is a string and matches a regex.

### Transformers:

These plugins probably change the inputs in the paths. In other words, they have `validateOnly` be `true`.

- `chain.defaultValue(defaultValue)`: change the input to `defaultValue` if `value` is `undefined`, `null`, `''` (empty string), or omitted.
- `chain.toDate(options?: {resetTime?: boolean, force?: boolean})`: convert the input to a `Date` object.
    Throw an error if the input is not a number, not a string, not a BigInt, not a Date object.
    Otherwise, check if the input can be converted to a valid Date object.
    
    When `resetTime` is `true`, reset `hour`, `minute`, `second`, and `millisecond` to zero.
- `chain.toFloat(options?: {min?: number, max?: number, force?: boolean})`: convert the input to a number.
    Throw an error if the input is a valid number or cannot be parsed to a number.
    Support range checking with the `min`, `max` in the options.
- `chain.toInt(options?: {min, max, force})`: convert the input to an integer number.
    Throw an error if the input is a valid number or cannot be parsed to an integer number.
    Support range checking with the `min`, `max` in the options.
- `chain.trim()`: trim value if it exists and is in string format. This transformer never throws any error.
- `chain.use(pluginConfigs: Array<[ITransformPlugin | string, ...any[]]>)`: combine multiple plugins.
   Parameters: `(required) pluginConfigs: array`: an array whose elements must have the following specification.
        - The first element is the plugin object or the name of an existing plugin (`'isType'`, `'transform'`, `'isLength'`, etc.).
        Note: `'message'` is not a plugin.
        - The rest of the array contains the options which will be passed to the plugins.

## How to add a custom plugin

You can add your own plugin via calling `addTransformerPlugin`. For example: `isUUID`, `isPostalCode`, `isCreditCard`, `toUpeerCase`, ...

Consult the [validator](https://www.npmjs.com/package/validator) package for more validators.

`addTransformerPlugin` accepts only one object presenting the plugin configuration, which should include the following properties.

- `(rquired) name: string`: the name of the plugin. Like: `isPostalCode`.
- `(required) getConfig: Function`: a function accepting any parameters which are the parameters provided to the plugin call (for e.g., `chain.isPostalCode(...params)`).
     . This function should return an object including the following properties.
    - `(required) transform: Function`: a function which accepts the same parameters as of `chain.transform`.
    - `(optional) options: Object`: the options object which will be passed to `.transform()`.
     It is highly recommended to set `validateOnly` option here to explicitly indicate that your plugin is a validator or a transformer.
     
It is recommended to make use of the exported `TransformationError` error when throwing an error.

Check [plugins](https://github.com/tranvansang/express-transformer/tree/master/src/plugins) directory for sample code.
If you think a plugin is useful and should be included in the initial plugin list, please fire and PR.
Otherwise, you can publish your own plugin to a separate package and add it with `addTransformerPlugin`.

When writing a plugin, please keep in mind that the input value can be anything.
It is extremely recommended that you should check the input value type via `typeof` or `instanceof` in the plugin, if you are going to publish it.

Side note: even if you overwrite methods (like `.message()` and `.transform()`), the core function is still protected and unaffected.

### How to extend the Typescript typing.

The transformation chain's interface can be exported via namespace and a global declaration from anywhere in your project like below.

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

Coupled with the universal-path string format, there are 3 utility functions that are used internally to manipulate the context object.

`const {recursiveGet, recursiveHas, recursiveSet} = require('express-transformer`)

These 3 methods are designed to **just work**, and **never** through any error with an arbitrary `context` parameter.

All `pathSplits` parameters are an array of strings indicating the traversal path to a location in the context object.

These methods use `Object.hasOwnProperty` to check if a key exists in an object.
Therefore, if the key is defined with an `undefined` value, it is considered as existing.

- `recursiveGet(context, pathSplits, defaultValue)`: get the value at `pathSplits`, return `defaultValue` if not exist.
- `recursiveSet(context, pathSplits, value)`: set the `value` at `pathSplits`.
At a point in the traversal path, if the value is not eligible for writing the value, it will reset the value at that path to be `{}`.
For example, calling on `{foo: 0}`, with `pathSplits = '['foo', 'bar', 'baar']'`, `value = 1`, will make the context object be `{foo: {bar: {baar: 1}}` (`0` is removed).
- `recursiveHas(context, pathSplits)`: check if there is a value at `pathSplits`.

Example: To create a `pathSplits`, you should just call `path.split('.')`.

## Error class

`const {TransformationError} = require('express-transformer')`

- If a transformation has an associated message, the error message is wrapped in a `TransformationError` object instance.
Otherwise, the error thrown by the callback in `.transform(callback)` is thrown.
- All default plugins use and throw only `TransformationError` error.
- The error's detailed information can be accessed by `error.info`, which is the `info` object passed to the `.transform()`'s `callback`.

- API: `constructor(message: string, info: ITransformCallbackInfo)`

# Annotations explanation

## Universal path format
A versatile string which support accessing value at any deep level and array iteration.

Giving a context object `obj`. The following `path` values make the library to look at the appropriate location in the context object.

- For example, if `path` is `'foo.bar'`, the library will look at `obj.foo.bar`.
- If `path` contains `[]`, the library will iterate all value at the path right before the `[]`'s occurrences.
- For example, if `path` is `foo[].bar.foo.baar[]`, the library will look at `obj.foo[0].bar.foo.baar[0]`, `obj.foo[1].bar.foo.baar[0]`, `obj.foo[2].bar.foo.baar[0]`, `obj.foo[0].bar.foo.baar[1]`.

## Array of arrays iteration

This library is handly if you want to validate/transform every element in an array, or every pair of elements between many arrays.

To indicate an array iteration, use the `[]` notation in the `path` value.

Let's see by examples:

- If `path` is `'foo[].bar.baar[]'`, the library will do the following
    - Travel to `req.body.foo`, if the current value is an array, iterator through all elements in the array.
    On each element, go deeper via the path `bar.baar`.
    - At `bar.baar` of the children object, iterate through all values in the array, pass it to the transformer callback.
    - If `validateOnly` is `false`, replace the value by the result returned from the callback (`Promise` returned value is also supported).
    
- If `path` is an array. Things become more complicated.

Base on the common sense, we **decided** to manually force the validation (ignoring the value of `force` when needed), to avoid several use cases.
Assume that you want to make an API to change user password. There are the following requirements which the API should satisfy.

- If `password` and `passwordConfirm` are omitted, skip changing the password  and may change other provided values).
- If `password` or `passwordConfirm` are provided, check if they equal with some condition (length, ...etc) before process the change.

`transformer(['password', 'passwordConfirm']).transform(callback)` is designed to do that for you.

- The most useful path of the array of arrays iteration, is that if there are multiple elements in the `path` object (which is an array of `string`) have the array notation (`[]`),
the library will pair them one by one, and pass their values in a list and call the `callback`.
The library also replaces the returned values in the corresponding locations, if `validateOnly` is `false`.
Accordingly, when `validateOnly` is `false` and `path` is an array, the `callback` is required to return an array.

# QA

Q1. How do I customize the error handler?

A1. Place your own error handler and check the error with `instanceof`.

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
