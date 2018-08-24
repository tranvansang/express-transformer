# Express transformer [![Build Status](https://travis-ci.org/tranvansang/express-transformer.svg?branch=master)](https://travis-ci.org/tranvansang/express-transformer)
[![NPM](https://nodei.co/npm/express-transformer.png)](https://nodei.co/npm/express-transformer/)

An express transformer, validator library

This [medium post](https://medium.com/p/f9cf12cc5986) is related to this package.

This tiny library helps you easier to get along with writing express validator middlewares, be more confident
when writing controller middleware when all parameters are ensured to satisfy requirements.

Check these real life samples

- Fully working sample
```javascript
import express from 'express'
import transformer, {transformationResult, TransformationError} from 'express-transformer'

const validate = (req, res, next) => {
  const errors = transformationResult(req)
  if (errors.length) {
    const err = next(errors[0])
    if (err instanceof TransformationError)
      return res.send(err.message)
    return next(err) //or return res.send('internal error')
  }
  next()
}

const app = express()
app.use('/change_age',
  transformer('age').toInt({min: 18}),
  validate,
  (req, res, next) => {
  ///req.body.age is ensured to be int and >= 18
  })
```
It is common to convert string type query's parameter into backend type. For example the page parameter
```javascript
app.use('/get_article',
  transformer('page', {location: 'query'})
    .defaultValue(1)
    .toInt({min: 1})
    .transform(val => val - 1),
  validate,
  (req, res, next) => {
  ///req.query.pagee is ensured to exist, be integer type, and >= 0, and subtracted 1 from value passed from client
  })
```
More common, but obvious case
```javascript
app.use('/signup',
  transformer('email')
    .exists()
    .isLength({min: 8}) //note that .exists() is required because if value is not provided, transformer will not be triggered
    .transform(async email => { // transformer can be async function
      let existingUser = await User.findByEmail(email).exec()
      if (existingUser) throw 'Email already existed'
      return email
    }),
  transformer(['password', 'passwordConfirm'])
    .exists()
    .trim()
    .isLength({min: 8})
    .transform(([password, passwordConfirm]) => {
      if (password !== passwordConfirm)
        throw 'Passwords do not match'
      return [password, passwordConfirm]//return the original values is required
    }),
  validate,
  (req, res, next) => {
  //now email, password, passwordConfirm are safe to be used
  }
)
```

## API

These are 2 types of function, basic usage, and sugar statistic built based on basic function.
It is very straight forward to write your own transformer.

There are only 5 basic functions. 3 are directly imported, and 2 others are called created instance

`import transformer, {transformationResult, TransformationError} from 'express-transformer'`

- `transformer(path, option)`: return the transformation chain for value in `path`.

    The transformation chain should be placed as typical express middleware (see examples)
    
    `option` is optional where
  - `option.nonstop`: default `false`
       
       Continue the transformation chain unless this is falsy
  - `option.location`: default `body`
  
    Location to look for value. It is recommended to set `option.location` be 1 level `'body'`, `'params'`, or `'query'`, and `path` parameter be multilevel e.g. `foo.bar.fooo`.
  
    Currently, it also supports to set `option.location` be multilevel, but this may be removed in future release, and is not recommended.

- `chain.message(callback, option)`: custom error message for the next transformer
  - `option.force`: default `false`
  
    Do not call the transformation it value is not provided unless `force` is truthy. Take note that this does not mean that `undefined`, `null` or empty string `''` is ignored.
  
    For example: with `req`  be `{body: {foo: undefined}}`.
    `transformer('foo').transform(callback)(req)`. `callback` **IS CALL**. (`undefined` can be replaced with `null`, `''`, or any other falsy values. Same thing will hapen)
    
    However, with `req` be `{body: {}}`. `foo` key is not provided. `callback` is **NOT** called
  - More options will be added in future releases.
  - `callback` receives 2 parameter `value` and `option`.
  
    With value is the current transformed value so far or the initial value in the first transformer.
  `option` has `location`, `path`, and `req` key correspond as theirs name.
  
      Error messages returned/resolved by `callback` will be used if the right next transformer throws error.
      `callback` passed to `.message` should not throw/reject error
- `chain.transform(callback)`: `callback` has the same form of parameters it receives with `callback` in `.messaage()`.
    
    This callback should return transformed value or throw error if value is invalid.
    Array of values will be passed if `path` is an array 

    Transformation chain will stop if `nonstop` option is `false` (default)
    
- `chain.each` (or `chain.every`): pass individual value to the transformer if path is array.
   Automatically fallback to `transform` if path is not array
    
- `transformationResult(req)`: returns array of transformation result. Each element has form of `{location, path, error}`.

  `error` has type of `TransformationError` if and only if the error was thrown from `callback` of transformer that has preceded by a custom message chain `.message()`
  
All other chain APIs are built from `custom()` function. All return the chain itself
- `chain.exists()`: invalidate if value is `undefined`, `null`, `''` (empty string), or not provided
- `chain.trim()`: trim value if exists and is string
- `chain.defaultValue(defaultValue)`: transform value to `defaultValue` if `value` is `undefined`, `null`, `''` (empty string), or not provided
- `chain.toInt({min, max})`: convert to integer number and validate its range. Throw error if value is not a valid number. `min`, `max` options are optional
- `chain.toFloat({min, max})`: similar to `toInt`
- `chain.isLength(length)`: check value's `length`. Value can be array or string type.
- `chain.matches(regex)`: check if value matches regex
- `chain.isIn(array)`: check if value is in the provided list

All [validators](https://www.npmjs.com/package/validator#validators) starts with `is...`
, and [transfomers](https://www.npmjs.com/package/validator#sanitizers) starts with `to...`
 from `validator` package are also supported.
 
 For example: `isUUID`, `isPostalCode`, `isCreditCard`, ...

Note that error will be thrown if non-string type value passed to `validator`'s transformer

Transformers can chain the previous likes
```javascript
transformer('page', {location: 'query'})
  .message(() => 'invalid page number')
  .toInt({min: 1})
  .transform(page => page - 1)
````
or
```javascript
import transformer, {transformationResult, TransformationError} from 'express-transformer'
const validate = (req, res, next) => {
  const errors = transformationResult(req)
  if (errors.length) {
    const err = next(errors[0])
    if (err instanceof TransformationError)
      return res.send(err.message)
    return next(err) //or return res.send('internal error')
  }
  next()
}

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