import {isObject, isString, recursiveGet, recursiveHas, recursiveSet} from '../src/util'
import * as validators from 'validator'

const {isInt, isFloat} = validators

export function TransformationError(message) {
  this.name = 'TransformationError'
  this.message = message
}

TransformationError.prototype = Error.prototype

export const transformationResult = req => req.__validationErrors || []

//NOTE: transformer ignore value that is not provided by default.
//Check their existence via .exists() or append {force: true} option in .transform(..)
export default (path, {
  location = 'body',
  nonstop = false
} = {}) => {
  const stack = []

  const middleware = async (req, res, next) => {
    try {
      let hasError = transformationResult(req).length
      let message = null

      const appendError = error => {
        req.__validationErrors = req.__validationErrors || []
        req.__validationErrors.push({
          location, path, error
        })
      }
      const fullpath = p => `${location}.${p}`
      const getValue = inlinePath =>
        Array.isArray(inlinePath)
          ? inlinePath.map(p => recursiveGet(req, fullpath(p)))
          : recursiveGet(req, fullpath(inlinePath))
      const setValue = (inlinePath, values) =>
        Array.isArray(inlinePath)
          ? inlinePath.map((p, i) => recursiveSet(req, fullpath(p), isObject(values) && values.hasOwnProperty(i) ? values[i] : undefined))
          : recursiveSet(req, fullpath(inlinePath), values)
      const doTransform = async (inlinePath, callback, force) => {
        if (force || Array.isArray(inlinePath) || recursiveHas(req, fullpath(inlinePath)))
          try {
            const sanitized = await callback(getValue(inlinePath), {req, path: inlinePath, location})
            setValue(inlinePath, sanitized)
          } catch (exception) {
            hasError = true
            let err
            if (message) {
              err = new TransformationError(message)
            } else
              err = exception
            appendError(err)
            return true
          }
      }
      for (const {type, callback, force} of stack) {
        if (!nonstop && hasError)
          break
        switch (type) {
          case 'every':
            if (Array.isArray(path)) {
              for (const p of path) 
                if (!nonstop && await doTransform(p, callback, force))
                  break
              message = null
              break
            }
          case 'transformer':
            await doTransform(path, callback, force)
            message = null
            break
          case 'message':
            try {
              message = await callback(getValue(), {req})
            } catch (err) {
              hasError = true
              appendError(err)
            }
            break
        }
      }
      next()
    } catch (err) {
      next(err)
    }
  }
  middleware.transform = (callback, options = {}) => {
    stack.push({
      ...options,
      type: 'transformer',
      callback
    })
    return middleware
  }

  middleware.message = callback => {
    stack.push({
      type: 'message',
      callback
    })
    return middleware
  }

  middleware.every = middleware.each = (callback, options = {}) => {
    stack.push({
      ...options,
      type: 'every',
      callback
    })
    return middleware
  }

  middleware.exists = () =>
    middleware.each((value, {path}) => {
      if (value === undefined || value === '' || value === null)
        throw new Error(`${path} is required`)
      return value
    }, {force: true})

  middleware.trim = () =>
    middleware.each(value => {
      if (isString(value)) return value.trim()
      return value
    })

  middleware.defaultValue = defaultValue =>
    middleware.each(
      value => value === undefined || value === '' || value === null ? defaultValue : value,
      {force: true}
    )

  // All value checked by validator's function need to be string type
  for (const [vKey, vCallback] of Object.entries(validators))
    if (vKey.startsWith('is'))
      middleware[vKey] = (...options) =>
        middleware.each((value, {path}) => {
          if (!isString(value))
            throw new Error(`${path} must be a string`)
          if (!vCallback(value, ...options))
            throw new Error(`${path} is not a valid ${value.slice(2)}`)
          return value
        })
    else if (vKey.startsWith('to'))
      middleware[vKey] = (...options) =>
        middleware.each((value, {path}) => {
          if (!isString(value))
            throw new Error(`${path} must be a string`)
          return vCallback(value, ...options)
        })


  middleware.toInt = (option = {}) =>
    middleware.each((value, {path}) => {
      let error = false
      if (isString(value) && !isInt(value))
        error = true
      if (typeof value === 'number')
        error = !Number.isInteger(value)
      else {
        value = parseFloat(value)
        if (isNaN(value))
          error = true
      }
      if (error) throw new Error(`${path} must be an integer`)
      if ('min' in option && value < option.min)
        throw new Error(`${path} must be at least ${option.min}`)
      if ('max' in option && value > option.max)
        throw new Error(`${path} must be at most ${option.max}`)
      return value
    })
  middleware.toFloat = (option = {}) =>
    middleware.each((value, {path}) => {
      let error = false
      if (isString(value) && !isFloat(value))
        error = true
      if (typeof value !== 'number') {
        value = parseFloat(value)
        if (isNaN(value))
          error = true
      }
      if (error) throw new Error(`${path} must be a number`)
      if ('min' in option && value < option.min)
        throw new Error(`${path} must be at least ${option.min}`)
      if ('max' in option && value > option.max) {
        throw new Error(`${path} must be at most ${option.max}`)
      }
      return value
    })

  middleware.isIn = values =>
    middleware.each((value, {path}) => {
      if (!values.includes(value))
        throw new Error(`${path} has invalid value`)
      return value
    })

  middleware.isLength = option =>
    middleware.each((value, {path}) => {
      if (isString(value)) {
        if ('min' in option && value.length < option.min)
          throw new Error(`${path} must be at least ${option.min} characters long`)
        if ('max' in option && value.length > option.max)
          throw new Error(`${path} must be at most ${option.max} characters long`)
        return value
      }
      throw new Error(`${path} must be a string`)
    })

  middleware.matches = regex =>
    middleware.each((value, {path}) => {
      if (regex.test(value))
        return value
      throw new Error(`${path} is not valid`)
    })
  return middleware
}