import {ITransformOptions, ITransformPlugin} from '../interfaces'
import {TransformationError} from '../transformer'

type JSType = 'string' | 'number' | 'boolean' | 'function' | 'bigint' | 'object' | 'undefined' | 'symbol'
declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			isType(type: JSType, options?: Omit<ITransformOptions, 'validateOnly'>): ITransformer<T, T, Options>
		}
	}
}

export default {
	name: 'isType',
	getConfig<T>(type: JSType, options?: Omit<ITransformOptions, 'validateOnly'>) {
		return {
			transform(val: T, info) {
				if (typeof val !== type) throw new TransformationError(
					`${info.path} must be of type ${type}`,
					info
				)
			},
			options: {...options, validateOnly: true}
		}
	}
} as ITransformPlugin
