import {ITransformOption, Middleware} from '../transformer'
import TransformationError from '../TransformationError'

declare module '../transformer' {
  interface Middleware {
    toDate(opts?: { resetTime?: boolean } & ITransformOption): Middleware
  }
}

export default (middleware: Middleware) => {
  middleware.toDate = ({resetTime, ...transformOption}: {resetTime?: boolean} & ITransformOption = {}) =>
    middleware.each((value, {path}) => {
        const time = Date.parse(value as string)
        if (isNaN(time) || !isFinite(time)) throw new TransformationError(`${path} must be in date format`)
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
}
