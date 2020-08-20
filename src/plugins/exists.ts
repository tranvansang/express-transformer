import TransformationError from '../TransformationError'
import {ITransformPlugin} from '../interfaces'

declare module '../utils' {
	interface ITransformer<T, V, Options> {
		exists(options?: { acceptEmptyString?: boolean }): ITransformer<T, T, Options>
	}
}

export default {
	name: 'exists',
	getConfig(
		{acceptEmptyString}: { acceptEmptyString?: boolean } = {}
	) {
		return {
			transform(value, info) {
				if (
					value === undefined
					|| value === null
					|| (!acceptEmptyString && typeof value === 'string' && value === '')
				) throw new TransformationError(`${info.path} is required`, info)
			},
			options: {force: true, validateOnly: true}
		}
	}
} as ITransformPlugin
