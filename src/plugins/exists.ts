import TransformationError from '../TransformationError'
import {ITransformCallbackOptions} from '../interfaces'

declare module '../utils' {
	interface ITransformer<T, V> {
		exists(options?: { acceptEmptyString?: boolean }): ITransformer<T, T>
	}
}

export default {
	name: 'exists',
	getConfig(
		{acceptEmptyString}: { acceptEmptyString?: boolean } = {}
	) {
		return {
			transform<T>(value: T, {path}: ITransformCallbackOptions) {
				if (
					value === undefined
					|| value === null
					|| (!acceptEmptyString && typeof value === 'string' && value === '')
				) throw new TransformationError(`${path} is required`)
			},
			options: {force: true, validateOnly: true}
		}
	}
}
