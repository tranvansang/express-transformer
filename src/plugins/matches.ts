import TransformationError from '../TransformationError'
import {ITransformer, ITransformPlugin} from '../interfaces'

declare module '../interfaces' {
	interface ITransformer<T, V> {
		matches(regex: RegExp, options?: {force?: boolean}): ITransformer<T, V>
	}
}

export default {
	name: 'matches',
	getConfig(regex: RegExp, {force}: {force?: boolean} = {}) {
		return {
			transform(value, {path}) {
				if (typeof value === 'string' && regex.test(value)) return value
				throw new TransformationError(`${path} is not valid`)
			},
			options: {
				force,
				validateOnly: true
			}
		}
	}
} as ITransformPlugin
