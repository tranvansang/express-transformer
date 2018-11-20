import {isString, recursiveGet, recursiveHas, recursiveSet} from './util'
import * as validators from 'validator'
import express from 'express'

export class TransformationError extends Error {
  constructor(message: string) {
    {
      try {
        super(message)
      } catch (err) {
      }
      this.message = message
    }
  }
}

export const errorKey = '__transformationErrors'
type Path = string | string[]
type Request = express.Request & { [key: string]: { location: string, path: Path, error: Error }[] }
type Option = { location: string, path: string, req: Request }
type MessageOption = { location: string, path: Path, req: Request }
type TransformedValue<T, V> = Date | string | number | T | V
type OptionalPromise<T> = T | Promise<T>
type SingleCallback<T, V> = (value: T, option: Option) => OptionalPromise<TransformedValue<T, V>>
type ArrayCallback<T, V> = (value: T[], option: Option) => OptionalPromise<TransformedValue<T, V>[]>
type Callback<T, V> = SingleCallback<T, V> | ArrayCallback<T, V>
type MessageCallback<T> = (value: T | T[], option: MessageOption) => OptionalPromise<string>
type TransformOption = { force?: boolean }

interface Middleware<T, V> {
  (req: Request, res: express.Response, next: express.NextFunction): Promise<void>

  transform(callback: Callback<T, V>, option?: TransformOption): Middleware<T, V>

  message(callback: Callback<T, V>, option?: TransformOption): Middleware<T, V>

  every(callback: Callback<T, V>, option?: TransformOption): Middleware<T, V>

  each(callback: Callback<T, V>, option?: TransformOption): Middleware<T, V>

  exists(option?: { acceptEmptyString?: boolean }): Middleware<T, V>

  trim(): Middleware<T, V>

  defaultValue(defaultValue: V): Middleware<T, V>

  [key: string]: ((options?: any) => Middleware<T, V>) | ((callback: Callback<T, V> | MessageCallback<T> | string, option?: { force?: boolean }) => Middleware<T, V>)
}

export const transformationResult = (req: Request) => req[errorKey] || []

//NOTE: transformer ignore value that is not provided by default.
//Check their existence via .exists() or append {force: true} option in .transform(..)
function transformer<T, V>(path: Path, {
  location = 'body',
  nonstop = false
} = {}) {
  const stack: { type: string, callback: Callback<T, V> | MessageCallback<T> | string, force?: boolean }[] = []

  const middleware: Middleware<T, V> = Object.assign(async (req: Request, res: express.Response, next: express.NextFunction) => {
    try {
      let hasError = !!transformationResult(req).length
      let message = ''
      let forcedMessage = ''

      const appendError = (error: Error) => {
        req[errorKey] = req[errorKey] || []
        req[errorKey].push({
          location, path, error
        })
      }
      const fullPath = (p: string) => [location, p].join('.')
      /**
       *
       * @param prefix Prefix added so far
       * @param firstArray currently processing array prefix
       * @param arrays remaining array prefixes
       * @param inlinePath last path
       * @param callback
       * @param force
       * @returns {Promise<void>}
       */
      const doSubtransform = async (prefix: string[], [firstArray, ...arrays]: string[], inlinePath: string, callback: Callback<T, V> | MessageCallback<T> | string, force?: boolean) => {
        const processArray = (p: string) => {
          //force only effective when value does not exist
          if (!recursiveHas(req, fullPath(p)) && !force) return []
          let values = recursiveGet(req, fullPath(p))
          //always reset existing value regardless force's value
          if (!Array.isArray(values)) {
            values = []
            recursiveSet(req, fullPath(p), [])
          }
          return values
        }
        if (firstArray) {
          prefix = [...prefix, firstArray]
          const values = processArray(prefix.join('.'))
          for (let i = 0; i < values.length; i++)
            await doSubtransform([...prefix, String(i)], arrays, inlinePath, callback, force)
        } else {
          if (/\[]$/.test(inlinePath)) {
            inlinePath = [...prefix, inlinePath.slice(0, inlinePath.length - 2)].join('.')
            const values = processArray(inlinePath)
            for (let i = 0; i < values.length; i++) {
              const p = [inlinePath, i].join('.')
              const value: T = recursiveGet(req, fullPath(p))
              const sanitized = await (callback as SingleCallback<T, V>)(value, {location, path: p, req})
              recursiveSet(req, fullPath(p), sanitized)
            }
          } else {
            inlinePath = [...prefix, inlinePath].join('.')
            if (force || recursiveHas(req, fullPath(inlinePath))) {
              const value = recursiveGet(req, fullPath(inlinePath))
              const sanitized = await (callback as SingleCallback<T, V>)(value, {location, path: inlinePath, req})
              recursiveSet(req, fullPath(inlinePath), sanitized)
            }
          }
        }
      }
      //return positive if error
      const doTransform = async (inlinePath: string, callback: Callback<T, V> | MessageCallback<T> | string, force?: boolean) => {
        try {
          if (!Array.isArray(inlinePath)) {
            const arraySplits = inlinePath.split(/\[]\./)
            await doSubtransform([], arraySplits.slice(0, arraySplits.length - 1), arraySplits[arraySplits.length - 1], callback, force)
          } else {
            if (force || inlinePath.some(p => recursiveHas(req, fullPath(p)))) {
              const values = inlinePath.map(p => recursiveGet(req, fullPath(p)))
              const sanitized = await (callback as ArrayCallback<T, V>)(values, {req, path: inlinePath, location})
              inlinePath.forEach((p, i) => recursiveSet(req, fullPath(p), sanitized && sanitized[i]))
            }
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
              message = ''
              break
            }
          //break statement is removed intentionally
          case 'transformer':
            await doTransform(path as string, callback, force)
            message = ''
            break
          case 'message':
            try {
              const values = Array.isArray(path)
                ? path.map(p => recursiveGet(req, fullPath(p)))
                : recursiveGet(req, fullPath(path))
              if (force) {
                forcedMessage = isString(callback) ? (callback as string) : await (callback as MessageCallback<T>)(values, {
                  req,
                  path,
                  location
                })
              } else {
                message = isString(callback) ? (callback as string) : await (callback as MessageCallback<T>)(values, {
                  req,
                  path,
                  location
                })
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
  }, {
    transform: (callback: Callback<T, V>, options = {}) => {
      stack.push({
        ...options,
        type: 'transformer',
        callback
      })
      return middleware
    },
    message: (callback: MessageCallback<T> | string, options = {}) => {
      stack.push({
        ...options,
        type: 'message',
        callback
      })
      return middleware
    }
  }) as Middleware<T, V>

  middleware.every = middleware.each = (callback: Callback<T, V>, options = {}) => {
    stack.push({
      ...options,
      type: 'every',
      callback
    })
    return middleware
  }

  middleware.exists = ({acceptEmptyString = false}: { acceptEmptyString?: boolean } = {}) =>
    middleware.each((value: T | string, {path}: Option) => {
      if (value === undefined || (!acceptEmptyString && value === '') || value === null)
        throw new Error(`${path} is required`)
      return value
    }, {force: true})

  middleware.trim = () =>
    middleware.each((value: T | string) => {
      if (isString(value)) return (value as string).trim()
      return value
    })

  middleware.defaultValue = (defaultValue: V) =>
    middleware.each(
      (value: T | string) => value === undefined || value === '' || value === null ? defaultValue : value,
      {force: true}
    )

  // All value checked by validator's function need to be string type
  for (const [vKey, vCallback] of Object.entries(validators))
    if (vKey.startsWith('is'))
      middleware[vKey] = (...options: any[]) =>
        middleware.each((value: T | string, {path}: Option) => {
          if (!isString(value))
            throw new Error(`${path} must be a string`)
          if (!vCallback(value, ...options))
            throw new Error(`${path} is not a valid ${(value as string).slice(2)}`)
          return value
        })
    else if (vKey.startsWith('to'))
      middleware[vKey] = (...options: any[]) =>
        middleware.each((value: T, {path}: Option) => {
          if (!isString(value))
            throw new Error(`${path} must be a string`)
          return vCallback(value, ...options)
        })


  middleware.toInt = ({min, max, ...transformOption}: { min?: number, max?: number } & TransformOption = {}) =>
    middleware.each((value: T | string | number, {path}: Option) => {
        value = parseInt(value as string)
        if (isNaN(value) || !isFinite(value))
          throw new Error(`${path} must be an integer`)
        if (min !== undefined && value < min)
          throw new Error(`${path} must be at least ${min}`)
        if (max !== undefined && value > max)
          throw new Error(`${path} must be at most ${max}`)
        return value
      },
      transformOption)
  middleware.toFloat = ({min, max, ...transformOption}: { min?: number, max?: number } & TransformOption = {}) =>
    middleware.each((value: T | string | number, {path}: Option) => {
        value = parseFloat(value as string)
        if (isNaN(value) || !isFinite(value))
          throw new Error(`${path} must be a number`)
        if (min !== undefined && value < min)
          throw new Error(`${path} must be at least ${min}`)
        if (max !== undefined && value > max) {
          throw new Error(`${path} must be at most ${max}`)
        }
        return value
      },
      transformOption)

  middleware.isIn = (values: T[], transformOptions?: TransformOption) =>
    middleware.each((value: T, {path}: Option) => {
      if (!values.includes(value))
        throw new Error(`${path} has invalid value`)
      return value
    }, transformOptions)

  middleware.isLength = (option: { min?: number, max?: number } | string | number, transformOption?: TransformOption) => {
    if (typeof option !== 'object') {
      const number = parseFloat(option as string)
      if (!isNaN(number) && isFinite(number)) {
        option = {min: number, max: number}
      }
    }
    return middleware.each((value: T | string, {path}: Option) => {
        if (isString(value) || Array.isArray(value)) {
          if (option.hasOwnProperty('min') && (value as string).length < ((option as { min?: number }).min as number))
            throw new Error(`${path} must have at least ${(option as { min?: number }).min as number} length`)
          if (option.hasOwnProperty('max') && (value as string).length > ((option as { max?: number }).max as number))
            throw new Error(`${path} must have at most ${(option as { max?: number }).max as number} length`)
          return value
        }
        throw new Error(`${path} must be a string or an array`)
      },
      transformOption)
  }

  middleware.matches = (regex: RegExp, transformOption?: TransformOption) =>
    middleware.each((value: T | string, {path}: Option) => {
        if (regex.test(value as string))
          return value
        throw new Error(`${path} is not valid`)
      },
      transformOption)

  middleware.toDate = ({resetTime, ...transformOption}: { resetTime?: boolean } & TransformOption = {}) =>
    middleware.each((value: T | string, {path}: Option) => {
        const time = Date.parse(value as string)
        if (isNaN(time) || !isFinite(time))
          throw new Error(`${path} must be in date format`)
        const date = new Date(time)
        if (resetTime) {
          date.setHours(0)
          date.setMinutes(0)
          date.setSeconds(0)
          date.setMilliseconds(0)
        }
        return date
      },
      transformOption)
  return middleware
}

export default transformer
