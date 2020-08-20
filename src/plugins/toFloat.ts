import TransformationError from '../TransformationError'
import {ITransformer, ITransformPlugin} from '../interfaces'

declare module '../interfaces' {
	interface ITransformer<T, V, Options> {
		toFloat(options?: {
			min?: number
			max?: number
			force?: boolean
		}): ITransformer<string | number, number, Options>
	}
}

export default {
	name: 'toFloat',
	getConfig({min, max, force}: {
		min?: number
		max?: number
		force?: boolean
	} = {}) {
		return {
			transform(value: string | number, info) {
				const {path} = info
				const floatValue = typeof value === 'string' ? parseFloat(value) : value
				if (
					isNaN(floatValue) || !isFinite(floatValue)
				) throw new TransformationError(`${path} must be a number`, info)
				if (
					min !== undefined && floatValue < min
				) throw new TransformationError(`${path} must be at least ${min}`, info)
				if (
					max !== undefined && floatValue > max
				) throw new TransformationError(`${path} must be at most ${max}`, info)
				return floatValue
			},
			config: {force, validateOnly: false}
		}
	}
} as ITransformPlugin
