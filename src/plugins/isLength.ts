import TransformationError from '../TransformationError'
import {ITransformer, ITransformPlugin} from '../interfaces'

declare module '../interfaces' {
	interface ITransformer<T, V> {
		isLength(
			options: { min?: number, max?: number } | string | number,
			transformOptions?: {force?: boolean}
		): ITransformer<T, V>
	}
}

export default {
	name: 'isLength',
	getConfig(
		options: { min?: number, max?: number } | string | number,
		{force}: {force?: boolean} = {}
	) {
		let min: number | undefined
		let max: number | undefined
		if (typeof options !== 'object') {
			const number = typeof options === 'string' ? parseFloat(options) : options
			if (!isNaN(number)) {
				min = number
				max = number
			}
		} else {
			min = options.min
			max = options.max
		}
		return {
			transform(value, {path}) {
				if (typeof value === 'string' || Array.isArray(value)) {
					if (
						min !== undefined && value.length < min
					) throw new TransformationError(`${path} must have at least ${min} length`)
					if (
						max !== undefined && value.length > max
					) throw new TransformationError(`${path} must have at most ${max} length`)
					return value
				}
				throw new TransformationError(`${path} must be a string or an array`)
			},
			options: {
				validateOnly: true,
				force
			}
		}
	}
} as ITransformPlugin
