import {ITransformOption, Middleware} from '../transformer'
import TransformationError from '../TransformationError'

declare module '../transformer' {
  interface Middleware {
    isIn<T>(values: ReadonlyArray<T>, opts?: ITransformOption): Middleware
  }
}

export default (middleware: Middleware) => {
  middleware.isIn = <T>(values: ReadonlyArray<T>, opts?: ITransformOption) =>
    middleware.each((value: T, {path}) => {
      if (!values.includes(value)) throw new TransformationError(`${path} has invalid value`)
      return value
    }, opts)

}
