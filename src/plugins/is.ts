import {ITransformOptions, ITransformPlugin} from '../interfaces'
import {TransformationError} from '../transformer'

declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			is(value: T, options?: Omit<ITransformOptions, 'validateOnly'>): ITransformer<T, T, Options>
		}
	}
}

export default {
	name: 'is',
	getConfig<T>(value: T, options?: Omit<ITransformOptions, 'validateOnly'>) {
		return {
			transform(val: T, info) {
				if (val !== value) throw new TransformationError(
					`${info.path} must be ${value}`,
					info
				)
			},
			options: {...options, validateOnly: true}
		}
	}
} as ITransformPlugin
