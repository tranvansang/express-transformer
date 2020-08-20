import TransformationError from '../TransformationError'
import {ITransformer, ITransformOptions, ITransformPlugin} from '../interfaces'

declare module '../interfaces' {
	interface ITransformer<T, V, Options> {
		matches(regex: RegExp, options?: Omit<ITransformOptions, 'validateOnly'>): ITransformer<T, T, Options>
	}
}

export default {
	name: 'matches',
	getConfig(regex: RegExp, options?: Omit<ITransformOptions, 'validateOnly'>) {
		return {
			transform(value, info) {
				if (typeof value !== 'string' || regex.test(value)) {
					throw new TransformationError(`${info.path} is not valid`, info)
				}
			},
			options: {
				...options,
				validateOnly: true
			}
		}
	}
} as ITransformPlugin
