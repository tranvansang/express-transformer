import {Middleware} from '../transformer'

declare module '../transformer' {
  interface Middleware {
    defaultValue<T>(defaultValue: T): Middleware
  }
}

export default (middleware: Middleware) => {
  middleware.defaultValue = <T>(defaultValue: T) =>
    middleware.each(
      (value: T) => value === undefined
      || value as unknown as string === ''
      || value === null
        ? defaultValue
        : value,
      {force: true}
    )
}
