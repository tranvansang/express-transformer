import TransformationError from '../TransformationError'
import {ITransformer, ITransformPlugin} from '../interfaces'

declare module '../interfaces' {
	interface ITransformer<T, V, Options> {
		matches(regex: RegExp, options?: {force?: boolean}): ITransformer<T, T, Options>
	}
}

export default {
	name: 'matches',
	getConfig(regex: RegExp, {force}: {force?: boolean} = {}) {
		return {
			transform(value, info) {
				if (typeof value === 'string' && regex.test(value)) return value
				throw new TransformationError(`${info.path} is not valid`, info)
			},
			options: {
				force,
				validateOnly: true
			}
		}
	}
} as ITransformPlugin
