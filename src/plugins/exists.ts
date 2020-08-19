import TransformationError from '../TransformationError'
import {ITransformCallbackOptions} from '../interfaces'

declare module '../transformer' {
	interface ITransformer<T, V> {
		exists(options?: { acceptEmptyString?: boolean }): ITransformer<T, V>
	}
}

export default {
	name: 'exists',
	transform: <T>(
		{acceptEmptyString}: { acceptEmptyString?: boolean } = {}
	) => (value: T, {path}: ITransformCallbackOptions) => {
		if (
			value === undefined
			|| value === null
			|| (!acceptEmptyString && typeof value === 'string' && value === '')
		) throw new TransformationError(`${path} is required`)
	},
	options: {force: true, validateOnly: true}
}
