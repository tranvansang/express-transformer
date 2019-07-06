import {ITransformOption, Middleware} from '../transformer'
import TransformationError from '../TransformationError'

declare module '../transformer' {
  interface Middleware {
    toInt(opts?: { min?: number, max?: number } & ITransformOption): Middleware
  }
}

export default (middleware: Middleware) => {
  middleware.toInt = ({min, max, ...transformOption}: { min?: number, max?: number } & ITransformOption = {}) =>
    middleware.each((value: string | number, {path}) => {
        value = typeof value === 'string' ? parseInt(value) : value
        if (isNaN(value) || !isFinite(value)) throw new TransformationError(`${path} must be an integer`)
        if (min !== undefined && value < min) throw new TransformationError(`${path} must be at least ${min}`)
        if (max !== undefined && value > max) throw new TransformationError(`${path} must be at most ${max}`)
        return value
      },
      transformOption)
}
