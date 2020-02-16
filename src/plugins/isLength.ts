import {ITransformOption, Middleware} from '../transformer'
import TransformationError from '../TransformationError'

declare module '../transformer' {
	interface Middleware<T, V> {
		isLength(option: { min?: number, max?: number } | string | number, opts?: ITransformOption): Middleware<T, V>
	}
}

export default <T, V>(middleware: Middleware<T, V>) => {
	middleware.isLength = (option, transformOption) => {
		let min: number | undefined
		let max: number | undefined
		if (typeof option !== 'object') {
			const number = typeof option === 'string' ? parseFloat(option) : option
			if (!isNaN(number)) min = max = number
		} else {
			min = option.min
			max = option.max
		}
		return middleware.each((value, {path}) => {
				if (typeof value === 'string' || Array.isArray(value)) {
					if (min !== undefined && value.length < min) throw new TransformationError(`${path} must have at least ${min} length`)
					if (max !== undefined && value.length > max) throw new TransformationError(`${path} must have at most ${max} length`)
					return value
				}
				throw new TransformationError(`${path} must be a string or an array`)
			},
			transformOption)
	}
}
