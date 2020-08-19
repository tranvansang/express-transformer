import TransformationError from '../TransformationError'
import {ITransformPlugin} from '../interfaces'

declare module '../interfaces' {
	interface ITransformer<T, V> {
		isIn(values: ReadonlyArray<T>, options?: {force?: boolean}): ITransformer<T, T>
	}
}

export default {
	name: 'isIn',
	getConfig<T>(values: ReadonlyArray<T>, {force}: {force?: boolean} = {}) {
		return {
			transform(value: T, {path}) {
				if (!values.includes(value)) throw new TransformationError(`${path} has invalid value`)
			},
			options: {force, validateOnly: true}
		}
	}
} as ITransformPlugin
