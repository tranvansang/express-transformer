import {ITransformOption, Middleware} from '../transformer'
import TransformationError from '../TransformationError'

declare module '../transformer' {
	interface Middleware<T, V> {
		toFloat(opts?: { min?: number, max?: number } & ITransformOption): Middleware<T, V>
	}
}

export default (middleware: Middleware<string | number, number>) => {
	middleware.toFloat = ({min, max, ...transformOption}: { min?: number, max?: number } & ITransformOption = {}) =>
		middleware.each((value, {path}) => {
				value = typeof value === 'string' ? parseFloat(value) : value
				if (isNaN(value) || !isFinite(value))
					throw new TransformationError(`${path} must be a number`)
				if (min !== undefined && value < min)
					throw new TransformationError(`${path} must be at least ${min}`)
				if (max !== undefined && value > max) {
					throw new TransformationError(`${path} must be at most ${max}`)
				}
				return value
			},
			transformOption)
}
