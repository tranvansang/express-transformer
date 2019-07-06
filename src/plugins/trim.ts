import {Middleware} from '../transformer'

declare module '../transformer' {
  interface Middleware {
    trim(): Middleware
  }
}

export default (middleware: Middleware) => {
  middleware.trim = () =>
    middleware.each(value => {
      if (typeof value === 'string') return value.trim()
      return value
    })
}
