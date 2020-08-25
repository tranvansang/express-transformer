import TransformationError from '../TransformationError'
import {ITransformOptions, ITransformPlugin} from '../interfaces'
import {isValidNumber} from '../utils'

declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			isLength(
				options: {
					min?: number
					max?: number
				} | string | number,
				transformOptions?: Omit<ITransformOptions, 'validateOnly'>
			): ITransformer<T & (string | Array<unknown>), V, Options>
		}
	}
}

export default {
	name: 'isLength',
	getConfig(
		options: { min?: number, max?: number } | string | number,
		transformOptions?: Omit<ITransformOptions, 'validateOnly'>
	) {
		let min: number | undefined
		let max: number | undefined
		if (typeof options !== 'object') {
			const number = typeof options === 'string' ? parseFloat(options) : options
			if (isValidNumber(number, true)) {
				min = number
				max = number
			}
		} else {
			min = options.min
			max = options.max
		}
		return {
			transform(value, info) {
				const {path} = info
				if (typeof value === 'string' || Array.isArray(value)) {
					if (
						min !== undefined && value.length < min
					) throw new TransformationError(`${path} must have at least ${min} length`, info)
					if (
						max !== undefined && value.length > max
					) throw new TransformationError(`${path} must have at most ${max} length`, info)
					return value
				}
				throw new TransformationError(`${path} must be a string or an array`, info)
			},
			options: {
				...transformOptions,
				validateOnly: true,
			}
		}
	}
} as ITransformPlugin
