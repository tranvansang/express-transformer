import TransformationError from '../TransformationError'
import {ITransformer, ITransformOptions, ITransformPlugin} from '../interfaces'

declare module '../interfaces' {
	interface ITransformer<T, V> {
		toFloat(options?: {
			min?: number
			max?: number
			force?: boolean
		}): ITransformer<string | number, number>
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
			transform(value: string | number, {path}) {
				const floatValue = typeof value === 'string' ? parseFloat(value) : value
				if (
					isNaN(floatValue) || !isFinite(floatValue)
				) throw new TransformationError(`${path} must be a number`)
				if (
					min !== undefined && floatValue < min
				) throw new TransformationError(`${path} must be at least ${min}`)
				if (
					max !== undefined && floatValue > max
				) throw new TransformationError(`${path} must be at most ${max}`)
				return floatValue
			},
			config: {force, validateOnly: false}
		}
	}
} as ITransformPlugin
