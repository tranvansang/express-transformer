import {ITransformOption, Middleware} from '../transformer'
import TransformationError from '../TransformationError'

declare module '../transformer' {
	interface Middleware<T, V> {
		matches(regex: RegExp, opts?: ITransformOption): Middleware<T, V>
	}
}

export default <T, V>(middleware: Middleware<T, V>) => {
	middleware.matches = (regex, transformOption) =>
		middleware.each((value, {path}) => {
				if (typeof value === 'string' && regex.test(value)) return value
				throw new TransformationError(`${path} is not valid`)
			},
			transformOption)
}
