import {ITransformOption, Middleware} from '../transformer'
import TransformationError from '../TransformationError'

declare module '../transformer' {
  interface Middleware<T, V> {
    isLength(option: { min?: number, max?: number } | string | number, opts?: ITransformOption): Middleware<T, V>
  }
}

export default <T, V>(middleware: Middleware<T, V>) => {
  middleware.isLength = (option, transformOption) => {
    if (typeof option !== 'object') {
      const number = parseFloat(option as string)
      if (!isNaN(number) && isFinite(number)) {
        option = {min: number, max: number}
      }
    }
    return middleware.each((value, {path}) => {
        if (typeof value === 'string' || Array.isArray(value)) {
          if (option.hasOwnProperty('min') && value.length < ((option as { min?: number }).min as number))
            throw new TransformationError(`${path} must have at least ${(option as { min?: number }).min as number} length`)
          if (option.hasOwnProperty('max') && value.length > ((option as { max?: number }).max as number))
            throw new TransformationError(`${path} must have at most ${(option as { max?: number }).max as number} length`)
          return value
        }
        throw new TransformationError(`${path} must be a string or an array`)
      },
      transformOption)
  }
}
