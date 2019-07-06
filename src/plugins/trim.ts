import {Middleware} from '../transformer'

declare module '../transformer' {
  interface Middleware<T, V> {
    trim(): Middleware<T, V>
  }
}

export default <T, V>(middleware: Middleware<T, V>) => {
  middleware.trim = () =>
    middleware.each(value => {
      if (typeof value === 'string') return value.trim()
      return value
    })
}