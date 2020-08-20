import TransformationError from '../TransformationError'
import {ITransformCallbackInfo, ITransformOptions, ITransformPlugin} from '../interfaces'

declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			toInt(options?: {
				min?: number
				max?: number
			} & Omit<ITransformOptions, 'validateOnly'>): ITransformer<T, number, Options>
		}
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
				if (typeof value !== 'bigint' && typeof value !== 'number' && typeof value !== 'string') {
					throw new TransformationError(`${path} must be a string or a number`, info)
				}
				const intValue = typeof value === 'string'
					? parseInt(value as string)
					: Math.trunc(typeof value === 'number' ? value as number : Number(value))
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
