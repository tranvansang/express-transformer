import {Middleware} from '../transformer'

declare module '../transformer' {
  interface Middleware<T, V> {
    defaultValue(defaultValue: T): Middleware<T, V>
  }
}

export default <T, V>(middleware: Middleware<T, V>) => {
  middleware.defaultValue = (defaultValue: T) =>
    middleware.each(
      (value: T) => value === undefined
      || value as unknown as string === ''
      || value === null
        ? defaultValue
        : value,
      {force: true}
    )
}
