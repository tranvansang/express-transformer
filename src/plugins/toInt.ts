import TransformationError from '../TransformationError'
import {ITransformCallbackInfo, ITransformOptions, ITransformPlugin} from '../interfaces'
import {isValidNumber} from '../utils'

type ToIntOptions = {
	min?: number
	max?: number
	acceptInfinity?: boolean
}
declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			toInt(
				options?: ToIntOptions & Omit<ITransformOptions, 'validateOnly'>
			): ITransformer<T & number, V, Options>
		}
	}
}

export default {
	name: 'toInt',
	getConfig({min, max, acceptInfinity, ...options}: ToIntOptions & Omit<ITransformOptions, 'validateOnly'> = {}) {
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
					!isValidNumber(intValue, !!acceptInfinity)
				) throw new TransformationError(`${path} must be a valid integer`, info)
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
