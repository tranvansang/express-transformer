import {Middleware} from '../transformer'
import TransformationError from '../TransformationError'

declare module '../transformer' {
  interface Middleware {
    exists(opts: { acceptEmptyString?: boolean }): Middleware
  }
}

export default (middleware: Middleware) => {
  middleware.exists = (
    {acceptEmptyString = false} = {}
  ) => middleware.each((value, {path}) => {
    if (
      value === undefined || (!acceptEmptyString && value === '') || value === null
    ) throw new TransformationError(`${path} is required`)
    return value
  }, {force: true})
}
