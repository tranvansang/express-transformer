import {ITransformOption, Middleware} from '../transformer'
import TransformationError from '../TransformationError'

declare module '../transformer' {
  interface Middleware<T, V> {
    isIn(values: ReadonlyArray<T>, opts?: ITransformOption): Middleware<T, V>
  }
}

export default <T, V>(middleware: Middleware<T, V>) => {
  middleware.isIn = (values: ReadonlyArray<T>, opts?: ITransformOption) =>
    middleware.each((value: T, {path}) => {
      if (!values.includes(value)) throw new TransformationError(`${path} has invalid value`)
      return value
    }, opts)

}
