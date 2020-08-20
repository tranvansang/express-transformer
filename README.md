# Express transformer [![Build Status](https://travis-ci.org/tranvansang/express-transformer.svg?branch=master)](https://travis-ci.org/tranvansang/express-transformer)
[![NPM](https://nodei.co/npm/express-transformer.png)](https://nodei.co/npm/express-transformer/)

Connect-like middleware to validate/transform data.

This library helps you easier to get along with writing express validator middlewares,
be more confident to implement your business logic without worrying about the data's validity.

# Usage samples

- Ensure a value exists
```javascript
import express from 'express'
import {transformer} from 'express-transformer'

const app = express()
app.use('/login',
	transformer('username').exists(),
	transformer('password').exists(),
	(req, res, next) => {
	//req.body.age and req.body.password exist, for sure
	})
app.listen(3000)
```

- Check passwords be the same
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

- Convert 1-base `page` parameter in query to a 0-base number
```javascript
app.use('/article',
	transformer('page', {location: 'query'})
		.defaultValue(1)
		.toInt({min: 1})
		.transform(val => val - 1),
	(req, res, next) => {
	})
```

- Check password length, validate email
More complicated, but obviously common case
```javascript
app.use('/signup',
	transformer('email')
		.exists()
        .message('Please provide email')
		.isLength({min: 8}) //note that .exists() is required because if value is not provided, transformer will not be triggered
        .message('Email is too short')
		.transform(async email => { // transformer can be async function
			const existingUser = await User.findByEmail(email).exec()
			if (existingUser) throw new Error('Email already existed')
		}, {validateOnly: true}),
	transformer(['password', 'passwordConfirm'], {validateOnly: true}) //force is false by default
		.exists()
		.trim()
		.isLength({min: 8})
		.transform(([password, passwordConfirm]) => {
			if (password !== passwordConfirm) throw new Error('Passwords do not match')
		}),
	(req, res, next) => {}
)
```

- Convert id to user
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
- `transformer` (also exported as the `default`)
- `addTransformerPlugin`
- `recursiveGet`
- `recursiveSet`
- `recursiveHas`

Typically, you only need to use the `transformer` in most of the cases.
This method returns a transformations chain used to validate/transform input data.
The transformations chain is also a connect-like middleware, and can be placed in the handler parameter in express (e.g. `app.use(chain)``).

A transformation/validation can be appended to a transformations chain by calling `chain.<method>`.
Basically, the library only defines two methods in a transformations chain, namely `.message` and `.transform`.

`addTransformerPlugin` is used to add custom methods along with transformers/validators.
By default, the library adds various plugins for your uses. Such as: `.isEmail`, `.exists`, `.defaultValue`, `.toInt`, ...
Check the Plugins section below for more information.

All methods from any transformations chain, including the methods defined by plugins and the default methods, always return the chain itself.
It is possible and recommended to add transformations to the chain by **chain**ing methods.
Such as: `chain.exists().isEmail().transform(emailToUser).message('Email not found')`

# API references

## Create a transformations chain
`transformer: (path, transformerOptions) => chain`
- Parameters:
    - `(required) path: string | string[]`: path or array of paths in *universal-path* format string.
    
        Sample values: `'email''`, `'foo[]'`, `['foo', 'bar']`, `['foo[]', 'foo[].bar.baar[]', 'fooo']`.
    - `(optional) transformerOptions: Object`: an option object with the following properties.
        - `(optional) location: string (default: 'body')`: a *universal-path* format string, which specifies where to find the input value from the `req` object.
- Returned value: a connect-like middleware which inherits all functionalities of a transformation chain.

## Transformation chain
A transformation chain supports following methods.

This list of methods can be extended via `addTransformerPlugin`.
Typescript extend is also supported.

- `chain.transform(callback, options)`: append a transformation to the chain.
    - Parameters:
        - `(required) callback: (value, info) => any`: the callback of the transformation, which should accept following parameters.
            - `value`: value or array of values
                - If the `path` option in `transformer(path, transformerOptions)` is a string, `value` will be the value of the current input.
                - If the `path` option in `transformer(path, transformerOptions)` is an array of string, `value` will be array of the values of the list of current inputs.
            - `info: Object`: an object which includes the following properties.
                - `path`: path to the current input.
                - `req`: the request `req` object from the connect-like middleware.
                - `options: Object`: the `transformerOptions` object passed in `.transform(callback, transformerOptions)`.
                
                    Note: this `options` object is always defined (i.e., not `undefined`), with `options.location` reflects the currently being used value of the `location`.
                    Which means, for e.g., if `transformerOptions` is `undefined`, the value of `options` will be `{location: 'body'}`.
                    If `transformerOptions` is `{foo: 'bar'}`, the value of `options` will be `{location: 'body', foo: 'bar'}`.
                    If `transformerOptions` is `{foo: 'bar', location: 'params'}`, the value of `options` will be `{location: 'params', foo: 'bar'}`.
        - `(optional)options: Object`: an optional option object with the following properties.
            - `(optional) force: boolean (default: false)`: when the input value is not provided, the transformation specified by `.transform` is skipped.
            
                Note: if the input is specified with `undefined`, the transformation is not skipped.
            - `(optional) validateOnly: boolean (default: false)`: keep the value unchanged after the transformation
    - Returned value: the chain itself
- `chain.message(callback, option)`: overwrite the error message of the one or more previous transformations in the chain.
    - Parameters:
        - `(required) callback: Function | string`: the string indicating the message or the function which accepts the same parameters as of the transformation (`value` and `info`).
        - `(optional) option: Object`: an object specifying the behavior of the overwriting message, which includes following properties
            - `(optional) force: boolean (default: false)`: regardless of the value of `force`, the message overwrites the error message of the most recent transformation if exist.
                If two consecutive messages are provided, the latter is preferred.
                - if `force` is `true`: overwrite the error message of all transformations in the chain from begin until when the message is called, *if there is no **overwritten** message*.

## Plugins
- `chain.exists({acceptEmptyString = false} = {})`: invalidate if value is `undefined`, `null`, `''` (empty string), or not provided. If `acceptEmptyString` is truthy, empty string is a valid value
- `chain.trim()`: trim value if exists and is string
- `chain.defaultValue(defaultValue)`: transform value to `defaultValue` if `value` is `undefined`, `null`, `''` (empty string), or not provided
- `chain.toInt({min, max, ...transformOption})`: convert to integer number and validate its range. Throw error if value is not a valid number. `min`, `max` options are optional
- `chain.toFloat({min, max, ...transformOption})`: similar to `toInt`
- `chain.isLength(option, transformOption)`: check value's length. Value can be array or string type. Option can be number (can be in string format), or object contain `min` and `max` key (must be numbers literally)
- `chain.matches(regex, transformOption)`: check if value matches regex
- `chain.isIn(array, transformOption)`: check if value is in the provided list
- `chain.toDate({resetTime, ...transformOption})`: convert value to `Date` object. Throw error if value is invalid. Reset `hour`, `minute`, `second`, `milisecond` if `resetTime` is true

## How to add a plugin
- For example: `isUUID`, `isPostalCode`, `isCreditCard`, ...

## Utility functions

## Error class

# Annotations explanation

## Universal path format
A versatile string which support accessing value at any deep level and array iteration.

Giving a context object `obj`. The following `path` values make the library to looks at the appropriate location in the context object.

- For example, if `path` is `'foo.bar'`, the library will look at `obj.foo.bar`.
- If `path` contains `[]`, the library will iterate all value at the path right before the `[]`'s occurrences.
- For example, if `path` is `foo[].bar.foo.baar[]`, the library will look at `obj.foo[0].bar.foo.baar[0]`, `obj.foo[1].bar.foo.baar[0]`, `obj.foo[2].bar.foo.baar[0]`, `obj.foo[0].bar.foo.baar[1]`.

## Array of arrays validation
 
# QA

1. How do I customize the error handler?

2. How do I collect all errors and throw at once?

Currently, there is no way to do. The transformation chains always stop at the first error.

## Change logs

See [change logs](./change-logs.md)
