import TransformationError from '../TransformationError'
import {ITransformPlugin} from '../interfaces'

declare module '../interfaces' {
	interface ITransformer<T, V, Options> {
		isIn(values: ReadonlyArray<T>, options?: {force?: boolean}): ITransformer<T, T, Options>
	}
}

export default {
	name: 'isIn',
	getConfig<T>(values: ReadonlyArray<T>, {force}: {force?: boolean} = {}) {
		return {
			transform(value: T, info) {
				if (!values.includes(value)) throw new TransformationError(`${info.path} has invalid value`, info)
			},
			options: {force, validateOnly: true}
		}
	}
} as ITransformPlugin
