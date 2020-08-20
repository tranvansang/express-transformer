import {ITransformOptions, ITransformPlugin} from '../interfaces'
import {TransformationError} from '../transformer'

declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			isArray(options?: Omit<ITransformOptions, 'validateOnly'>): ITransformer<T, Array<unknown>, Options>
		}
	}
}

export default {
	name: 'isArray',
	getConfig(options?: Omit<ITransformOptions, 'validateOnly'>) {
		return {
			transform(value, info) {
				if (!Array.isArray(value)) throw new TransformationError(
					`${info.path} must be an array`,
					info
				)
			},
			options: {...options, validateOnly: true}
		}
	}
} as ITransformPlugin
