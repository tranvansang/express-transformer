import {Middleware} from '../transformer'
import TransformationError from '../TransformationError'

declare module '../transformer' {
  interface Middleware<T, V> {
    exists(opts: { acceptEmptyString?: boolean }): Middleware<T, V>
  }
}

export default <T, V>(middleware: Middleware<T, V>) => {
  middleware.exists = (
    {acceptEmptyString = false} = {}
  ) => middleware.each((value, {path}) => {
    if (
      value === undefined || (!acceptEmptyString && value === '') || value === null
    ) throw new TransformationError(`${path} is required`)
    return value
  }, {force: true})
}
