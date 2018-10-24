import {isObject, isString, recursiveGet, recursiveHas, recursiveSet} from './util'
import * as validators from 'validator'

const {isInt, isFloat} = validators

export class TransformationError extends Error {
  constructor(...args){{
    try {
      super(...args)
    }catch(err){}
    this.message = args[0]
  }}
}

export const errorKey = '__transformationErrors'
export const transformationResult = req => req[errorKey] || []

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
      let forcedMessage = null

      const appendError = error => {
        req[errorKey] = req[errorKey] || []
        req[errorKey].push({
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
      const hasValue = inlinePath =>
        Array.isArray(inlinePath)
          ? inlinePath.some(p => recursiveHas(req, fullpath(p)))
          : recursiveHas(req, fullpath(inlinePath))

      const doSubtransform = (prefixArray, [fisrtArray, ...arrays], inlinePath) => {
        if (firstArray){
        }
        //if inlinePath is array, arrays will be empty
        const sanitized = await callback(getValue(inlinePath), {req, path: inlinePath, location})
        setValue(inlinePath, sanitized)
      }
      const doTransform = async (inlinePath, callback, force) => {
        if (force || hasValue(inlinePath))
          try {
            if (!Array.isArray(inlinePath)){
              const arraySplits = inlinePath.split(/\[]\./)
              doSubtransform([location], arraySplits.slice(0, arraySplits.length - 1), arraySplits[arraySplits.length - 1])
            } else {
              doSubtransform([location], [], inlinePath)
            }
          } catch (exception) {
            hasError = true
            let err
            if (!(exception instanceof TransformationError) && (message || forcedMessage)) {
              err = new TransformationError(message || forcedMessage)
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
            //break statement is removed intentionally
          case 'transformer':
            await doTransform(path, callback, force)
            message = null
            break
          case 'message':
            try {
              if (force){
                forcedMessage = isString(callback) ? callback : await callback(getValue(), {req})
              }else {
                message = isString(callback) ? callback : await callback(getValue(), {req})
              }
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

  middleware.message = (callback, options = {}) => {
    stack.push({
      ...options,
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

  middleware.exists = ({acceptEmptyString = false} = {}) =>
    middleware.each((value, {path}) => {
      if (value === undefined || (!acceptEmptyString && value === '') || value === null)
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

  middleware.isLength = option => {
    const number = parseFloat(option)
    if (!isNaN(number)){
      option = {min: number, max: number}
    }
    return middleware.each((value, {path}) => {
      if (isString(value) || Array.isArray(value)) {
        if (option.hasOwnProperty('min') && value.length < option.min)
          throw new Error(`${path} must have at least ${option.min} length`)
        if (option.hasOwnProperty('max') && value.length > option.max)
          throw new Error(`${path} must have at most ${option.max} length`)
        return value
      }
      throw new Error(`${path} must be a string or an array`)
    })
  }

  middleware.matches = regex =>
    middleware.each((value, {path}) => {
      if (regex.test(value))
        return value
      throw new Error(`${path} is not valid`)
    })
  return middleware
}
