import TransformationError from '../TransformationError'
import {ITransformer, ITransformPlugin} from '../interfaces'

declare module '../interfaces' {
	interface ITransformer<T, V> {
		toInt(options?: {
			min?: number
			max?: number
			force?: boolean
		}): ITransformer<T, V>
	}
}

export default {
	name: 'toInt',
	getConfig({min, max, force}: {
		min?: number
		max?: number
		force?: boolean
	} = {}) {
		return {
			transform(value: string | number, {path}) {
				value = typeof value === 'number' ? Math.trunc(value) : parseInt(value)
				if (isNaN(value) || !isFinite(value)) throw new TransformationError(`${path} must be an integer`)
				if (min !== undefined && value < min) throw new TransformationError(`${path} must be at least ${min}`)
				if (max !== undefined && value > max) throw new TransformationError(`${path} must be at most ${max}`)
				return value
			},
			options: {force, validateOnly: false}
		}
	}
} as ITransformPlugin
