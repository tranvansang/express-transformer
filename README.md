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
app.listen(3000)
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
More complicated, but obviously common case
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
  transformer(['password', 'passwordConfirm'], {force: false}) //force is false by default
    .exists()
    .trim()
    .isLength({min: 8})
    .transform(([password, passwordConfirm]) => {
      //because force option is false. If email transformer throws error, this transformer will be ignored
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

`import transformer, {transformationResult, TransformationError} from 'express-transformer'`

**Basic APIs**

- `transformer(path, option)`: return the transformation chain for value in `path`. `path` can be string or array of strings. For example: [`sender.email`, `sender.password`, `content`], ...

    The transformation chain should be placed as typical express middleware (see examples)
    
    `option` is optional where
  - `option.nonstop`: default `false`. Continue the transformation chain if this option is truthy
  - `option.location`: default `body`. Location to look for value. `body` can be multilevel. For example: `body.user`

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
    
- `chain.each` (or `chain.every`): pass individual value to the transformer if path is an array.
   Otherwise, automatically fallback to `transform` (if path is not an array)
    
- `transformationResult(req)`: returns array of transformation result. Each element has form of `{location, path, error}`.

  `error` has type of `TransformationError` if and only if the error was thrown from `callback` of transformer that has preceded by a custom message chain `.message()`
  
  String message or any object returned by (not thrown by) `.message`'s callback is stored in `error.message` regardless of the returned value's type
  
All next following chain APIs are built based on `every()` function. They all return the chain itself
- `chain.exists({acceptEmptyString = false} = {})`: invalidate if value is `undefined`, `null`, `''` (empty string), or not provided. If `acceptEmptyString` is truthy, empty string is a valid value
- `chain.trim()`: trim value if exists and is string
- `chain.defaultValue(defaultValue)`: transform value to `defaultValue` if `value` is `undefined`, `null`, `''` (empty string), or not provided
- `chain.toInt({min, max})`: convert to integer number and validate its range. Throw error if value is not a valid number. `min`, `max` options are optional
- `chain.toFloat({min, max})`: similar to `toInt`
- `chain.isLength(option)`: check value's length. Value can be array or string type. Option can be number (can be in string format), or object contain `min` and `max` key (must be numbers literally)
- `chain.matches(regex)`: check if value matches regex
- `chain.isIn(array)`: check if value is in the provided list

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

## Change logs

See [change logs](./change-logs.md)
