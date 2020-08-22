import TransformationError from '../TransformationError'
import {ITransformCallbackInfo, ITransformOptions, ITransformPlugin} from '../interfaces'

declare global {
	namespace ExpressTransformer {
		interface ITransformer<T, V, Options> {
			toFloat(options?: {
				min?: number
				max?: number
			} & Omit<ITransformOptions, 'validateOnly'>): ITransformer<T, number, Options>
		}
	}
}

export default {
	name: 'toFloat',
	getConfig({min, max, ...options}: {
		min?: number
		max?: number
	} & Omit<ITransformOptions, 'validateOnly'> = {}) {
		return {
			transform<T, V, Options>(value: T, info: ITransformCallbackInfo<Options>) {
				const {path} = info
				if (typeof value !== 'bigint' && typeof value !== 'number' && typeof value !== 'string') {
					throw new TransformationError(`${path} must be a string or a number`, info)
				}
				const floatValue = typeof value === 'string'
					? parseFloat(value as string)
					: typeof value === 'bigint'
						? Number(value)
						: value as number
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
			config: {...options, validateOnly: false}
		}
	}
} as ITransformPlugin
