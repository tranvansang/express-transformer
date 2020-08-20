import TransformationError from '../TransformationError'
import {ITransformOptions, ITransformPlugin} from '../interfaces'

declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			matches(regex: RegExp, options?: Omit<ITransformOptions, 'validateOnly'>): ITransformer<T, string, Options>
		}
	}
}

export default {
	name: 'matches',
	getConfig(regex: RegExp, options?: Omit<ITransformOptions, 'validateOnly'>) {
		return {
			transform(value, info) {
				if (typeof value !== 'string' || !regex.test(value)) {
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
