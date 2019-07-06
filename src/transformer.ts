import {recursiveGet, recursiveHas, recursiveSet} from './util'
import {NextFunction, Request, RequestHandler, Response,} from 'express'
import TransformationError from './TransformationError'
import exists from './plugins/exists'
import isIn from './plugins/isIn'
import isLength from './plugins/isLength'
import matches from './plugins/matches'
import toDate from './plugins/toDate'
import toFloat from './plugins/toFloat'
import toInt from './plugins/toInt'
import trim from './plugins/trim'
import defaultValue from './plugins/defaultValue'

export const errorKey = '__transformationErrors'
type IPath = string | string[]
type IError = {
  location: string
  path: IPath
  error: TransformationError
}
declare module 'express' {
  interface Request {
    __transformationErrors: Array<IError>
  }
}
export interface ITransformOption {
  force?: boolean
}
type ICallbackOptionParam = {
  location: string
  path: string
  req: Request
}
interface ICallback<T, V> {
  (value: T, opts: ICallbackOptionParam): V | Promise<V>
}
export interface Middleware extends RequestHandler {
  transform<T, V>(callback: ICallback<T, V>, opts?: ITransformOption): Middleware
  message<T>(callback: string | ICallback<T, string>, opts?: ITransformOption): Middleware
  each<T, V>(callback: ICallback<T, V>, opts?: ITransformOption): Middleware
  every<T, V>(callback: ICallback<T, V>, opts?: ITransformOption): Middleware
}
type IPlugin = <T, V>(middelware: Middleware) => void

export const transformationResult = (req: Request): ReadonlyArray<IError> => req[errorKey] || []
const plugins: IPlugin[] = []
enum CallbackType {
  transformer = 'transformer',
  every = 'every',
  message = 'message'
}
//NOTE: transformer ignore value that is not provided by default.
//Check their existence via .exists() or append {force: true} option in .transform(..)
export default <T, V>(path: IPath, {
  location = 'body',
  nonstop = false
} = {}) => {
  const appendError = (req: Request, error: Error) => {
    req[errorKey] = req[errorKey] || []
    req[errorKey].push({
      location, path, error
    })
  }
  const fullPath = (p: string) => [location, p].join('.')
  const stack: Array<{ type: CallbackType, callback: string | ICallback<T, V> | ICallback<T, string>} & ITransformOption> = []

  const middleware: Middleware = Object.assign(async (req: Request, res: Response, next: NextFunction) => {
    try {
      let hasError = !!transformationResult(req).length
      let message = ''
      let forcedMessage = ''
      /**
       * @param prefix Prefix added so far
       * @param firstArray currently processing array prefix
       * @param arrays remaining array prefixes
       * @param inlinePath last path
       * @param callback
       * @param force
       * @returns {Promise<void>}
       */
      const subTransform = async (
        prefix: string[],
        [firstArray, ...arrays]: string[],
        inlinePath: string,
        callback: ICallback<T, V> | ICallback<T, string>,
        force?: boolean
      ) => {
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
            await subTransform([...prefix, String(i)], arrays, inlinePath, callback, force)
        } else {
          if (/\[]$/.test(inlinePath)) {
            inlinePath = [...prefix, inlinePath.slice(0, inlinePath.length - 2)].join('.')
            const values = processArray(inlinePath)
            for (let i = 0; i < values.length; i++) {
              const p = [inlinePath, i].join('.')
              const value = recursiveGet(req, fullPath(p))
              const sanitized = await callback(value, {location, path: p, req})
              recursiveSet(req, fullPath(p), sanitized)
            }
          } else {
            inlinePath = [...prefix, inlinePath].join('.')
            if (force || recursiveHas(req, fullPath(inlinePath))) {
              const value = recursiveGet(req, fullPath(inlinePath))
              const sanitized = await (callback)(value, {location, path: inlinePath, req})
              recursiveSet(req, fullPath(inlinePath), sanitized)
            }
          }
        }
      }
      //return positive if error
      const doTransform = async (inlinePath: string, callback: ICallback<T, V> | ICallback<T, string>, force?: boolean) => {
        try {
          if (!Array.isArray(inlinePath)) {
            const arraySplits = inlinePath.split(/\[]\./)
            await subTransform([], arraySplits.slice(0, arraySplits.length - 1), arraySplits[arraySplits.length - 1], callback, force)
          } else {
            if (force || inlinePath.some(p => recursiveHas(req, fullPath(p)))) {
              const values = inlinePath.map(p => recursiveGet(req, fullPath(p))) as unknown as T
              const sanitized = await callback(values, {req, path: inlinePath, location})
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
          appendError(req, err)
          return true
        }
      }
      for (const {type, callback, force} of stack) {
        if (!nonstop && hasError)
          break
        switch (type) {
          case CallbackType.every:
            if (Array.isArray(path)) {
              for (const p of path)
                if (!nonstop && await doTransform(p, callback as ICallback<T, V>, force))
                  break
              message = ''
              break
            }
          //break statement is removed intentionally
          case CallbackType.transformer:
            await doTransform(path as string, callback as ICallback<T, V>, force)
            message = ''
            break
          case CallbackType.message:
            try {
              const values = Array.isArray(path)
                ? path.map(p => recursiveGet(req, fullPath(p)))
                : recursiveGet(req, fullPath(path))
              if (force) forcedMessage = typeof callback === 'string'
                ? callback
                : await callback(values, {
                  req,
                  path,
                  location
                })
              else message = typeof callback === 'string'
                ? callback
                : await callback(values, {
                  req,
                  path,
                  location
                })
            } catch (err) {
              hasError = true
              appendError(req, err)
            }
            break
        }
      }
      next()
    } catch (err) {
      next(err)
    }
  }, {
    transform: (callback: ICallback<T, V>, options = {}) => {
      stack.push({
        ...options,
        type: CallbackType.transformer,
        callback
      })
      return middleware
    },
    message: (callback: ICallback<T, string>, options = {}) => {
      stack.push({
        ...options,
        type: CallbackType.message,
        callback
      })
      return middleware
    }
  })

  middleware.every = middleware.each = (callback: ICallback<T, V>, options = {}) => {
    stack.push({
      ...options,
      type: CallbackType.every,
      callback
    })
    return middleware
  }
  for (const plugin of plugins) plugin(middleware)
  return middleware
}

export const addTransformerPlugin = (plugin: IPlugin) => plugins.push(plugin)

addTransformerPlugin(exists)
addTransformerPlugin(isIn)
addTransformerPlugin(isLength)
addTransformerPlugin(matches)
addTransformerPlugin(toDate)
addTransformerPlugin(toFloat)
addTransformerPlugin(toInt)
addTransformerPlugin(trim)
addTransformerPlugin(defaultValue)

