import {ITransformOption, Middleware} from '../transformer'
import TransformationError from '../TransformationError'

declare module '../transformer' {
  interface Middleware {
    matches(regex: RegExp, opts?: ITransformOption): Middleware
  }
}

export default (middleware: Middleware) => {
  middleware.matches = (regex, transformOption) =>
    middleware.each((value, {path}) => {
        if (regex.test(value as string)) return value
        throw new TransformationError(`${path} is not valid`)
      },
      transformOption)
}
