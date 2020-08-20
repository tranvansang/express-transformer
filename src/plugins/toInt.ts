import TransformationError from '../TransformationError'
import {ITransformCallbackInfo, ITransformer, ITransformOptions, ITransformPlugin} from '../interfaces'

declare module '../interfaces' {
	interface ITransformer<T, V, Options> {
		toInt(options?: {
			min?: number
			max?: number
		} & Omit<ITransformOptions, 'validateOnly'>): ITransformer<T, number, Options>
	}
}

export default {
	name: 'toInt',
	getConfig({min, max, ...options}: {
		min?: number
		max?: number
	} & Omit<ITransformOptions, 'validateOnly'> = {}) {
		return {
			transform<T, V, Options>(value: T, info: ITransformCallbackInfo<Options>) {
				const {path} = info
				if (typeof value !== 'number' && typeof value !== 'string') {
					throw new TransformationError(`${path} must be a string or a number`, info)
				}
				const intValue = typeof value === 'number' ? Math.trunc(value as number) : parseInt(value as string)
				if (
					isNaN(intValue) || !isFinite(intValue)
				) throw new TransformationError(`${path} must be an integer`, info)
				if (
					min !== undefined && intValue < min
				) throw new TransformationError(`${path} must be at least ${min}`, info)
				if (
					max !== undefined && intValue > max
				) throw new TransformationError(`${path} must be at most ${max}`, info)
				return intValue
			},
			options: {...options, validateOnly: false}
		}
	}
} as ITransformPlugin
