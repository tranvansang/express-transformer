import TransformationError from '../TransformationError'
import isEmailCore, {IIsEmailOptions} from './isEmailCore'
import {ITransformer, ITransformPlugin} from '../interfaces'

declare module '../interfaces' {
	interface ITransformer<T, V, Options> {
		isEmail(options?: IIsEmailOptions): ITransformer<string, string, Options>
	}
}

export default {
	name: 'isEmail',
	getConfig({force, ...options}: IIsEmailOptions & {force?: boolean} = {}) {
		return {
			transform(value: string, info) {
				if (!isEmailCore(value, options)) throw new TransformationError(`${info.path} has invalid value`, info)
				return value
			},
			options: {force}
		}
	}
} as ITransformPlugin
