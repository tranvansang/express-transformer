import TransformationError from '../TransformationError'
import {ITransformOptions, ITransformPlugin} from '../interfaces'

declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			isIn(
				values: ReadonlyArray<T>,
				options?: Omit<ITransformOptions, 'validateOnly'>
			): ITransformer<T, V, Options>
		}
	}
}

export default {
	name: 'isIn',
	getConfig<T>(values: ReadonlyArray<T>, options?: Omit<ITransformOptions, 'validateOnly'>) {
		return {
			transform(value: T, info) {
				if (!values.includes(value)) throw new TransformationError(`${info.path} has invalid value`, info)
			},
			options: {...options, validateOnly: true}
		}
	}
} as ITransformPlugin
