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
        .message('Email is not long enough')
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

# API reference and usage

There are two named exported `transformer` and `addTransformerPlugin`.

`import {transformer, addTransformerPlugin} from 'express-transformer'`

## Create a transformation chain
`transformer(path, option)`
- Parameters:
    - `(required) path: string | string[]`: path or array of paths. Support array of arrays validation.
     Sample values: `'email''`, `'foo[]'`, `['foo', 'bar']`, `['foo[]', 'foo[].bar.baar[]', 'fooo']`.
    - `(optional) option`: an option object with following properties.
        - `location: string (default: 'body')`: a *universal path format* string with `req` as the context object, which specifies where to find the input value
- Returned value: a connect-like middleware which inherits all functionalities of a transformation chain.

## Universal path format
A versatile string which support accessing value at any deep level and array iteration.

Giving a context object `obj`. The following `path` values make the library to looks at the appropriate location in the context object.

- For example, if `path` is `'foo.bar'`, the library will look at `obj.foo.bar`.
- If `path` contains `[]`, the library will iterate all value at the path right before the `[]`'s occurrences.
- For example, if `path` is `foo[].bar.foo.baar[]`, the library will look at `obj.foo[0].bar.foo.baar[0]`, `obj.foo[1].bar.foo.baar[0]`, `obj.foo[2].bar.foo.baar[0]`, `obj.foo[0].bar.foo.baar[1]`.

## Array of arrays validation
         
## Transformation chain
A transformation chain supports following methods.

This list of methods can be added via `addTransformerPlugin`, Typescript extend is also supported.

- `chain.transform(callback, option)`: append a transformation to the chain.
    - Parameters:
        - `(required) callback`: the callback of transformation, which should accept following parameters
            - `value`:
                - If the `path` option in `transformer(path, option)` is a string, `value` will be value of the input.
                - If the `path` option in `transformer(path, option)` is an array of string, `value` will be array of values of the input.
            - `info`: an object which includes the following properties.
                - `path`
                - `location`
                - `req`
        - `(optional)option`: an optional option object with the following properties.
            - `(optional) force: boolean (default: false)`: when the input value is not provided, the transformation specified by `.transform` is skipped.
            
                Note: if the input is specified with `undefined`, the transformation is not skipped.
            - `(optional) validateOnly: boolean (default: false)`: keep the value after the transformation
            
## Plugins

## How to add a plugin

## Utility functions

## Error class

    The transformation chain should be placed as typical express middleware (see examples)

- `chain.message(callback)`: custom error message for the next transformer and return the chain
  - `callback` receives 2 parameter, the value to be transformed, and `{location, path, req}`
  
      Error messages returned/resolved by `callback` will be used if the right next transformer throws error.
      This `callback` should not throw/reject error
- `chain.transform(callback, options)`: add new custom transformation and return the chain
    
    `callback` receives 2 parameter, the value to be transformed, and `{location, path, req}`
    
    `callback` should return transformed value or throw error if value is invalid.
    
    If `path` is an array, array of values will be passed to the `callback`, otherwise, only pass the single value 
    - `option.force`: default `false`
    
        This `option.force` is falsy. `undefined`, `null`, empty string `''` are all ignored.
        
        Otherwise, always call `callback`
  
    Example: with `req`  be `{body: {foo: undefined}}`.
    `transformer('foo').transform(callback)(req)`. `callback` **IS CALLED**. (`undefined` can be replaced with `null`, `''`, or any other falsy values. Same thing will happen)
    
    However, with `req` be `{body: {}}`. (remember `foo` key is not provided). `callback` is **NOT** called
    
- `chain.exists({acceptEmptyString = false} = {})`: invalidate if value is `undefined`, `null`, `''` (empty string), or not provided. If `acceptEmptyString` is truthy, empty string is a valid value
- `chain.trim()`: trim value if exists and is string
- `chain.defaultValue(defaultValue)`: transform value to `defaultValue` if `value` is `undefined`, `null`, `''` (empty string), or not provided
- `chain.toInt({min, max, ...transformOption})`: convert to integer number and validate its range. Throw error if value is not a valid number. `min`, `max` options are optional
- `chain.toFloat({min, max, ...transformOption})`: similar to `toInt`
- `chain.isLength(option, transformOption)`: check value's length. Value can be array or string type. Option can be number (can be in string format), or object contain `min` and `max` key (must be numbers literally)
- `chain.matches(regex, transformOption)`: check if value matches regex
- `chain.isIn(array, transformOption)`: check if value is in the provided list
- `chain.toDate({resetTime, ...transformOption})`: convert value to `Date` object. Throw error if value is invalid. Reset `hour`, `minute`, `second`, `milisecond` if `resetTime` is true

All [validators](https://www.npmjs.com/package/validator#validators) starts with `is...`
, and [transfomers](https://www.npmjs.com/package/validator#sanitizers) starts with `to...`
 from `validator` package are also supported.
 
 For example: `isUUID`, `isPostalCode`, `isCreditCard`, ...

Note that error will be thrown if non-string type value passed to transformers inherited from `validator` package

Transformers can chain the previous likes
```javascript
transformer('page', {location: 'query'})
	.message(() => 'invalid page number')
	.toInt({min: 1})
	.transform(page => page - 1)
````
or
```javascript
import {transformer} from 'express-transformer'

app.use('/article_name/:id',
		transformer('id', {location: 'params'})
				.message(() => 'invalid article ID')
				.transform(async id => await Article.findById(id).exec())
				.transform(article => article.name)
				.transform(name => capitalize(name)),
		validate,
		(req, res) => {
				res.send(`Article's capitalized name is ${req.params.id}`)
		})
```

## Change logs

See [change logs](./change-logs.md)
