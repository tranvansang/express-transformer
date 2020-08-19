import TransformationError from '../TransformationError'
import isEmailCore, {IIsEmailOptions} from './isEmailCore'
import {ITransformer, ITransformPlugin} from '../interfaces'

declare module '../interfaces' {
	interface ITransformer<T, V> {
		isEmail(options?: IIsEmailOptions): ITransformer<string, string>
	}
}

export default {
	name: 'isEmail',
	getConfig({force, ...options}: IIsEmailOptions & {force?: boolean} = {}) {
		return {
			transform(value: string, {path}) {
				if (!isEmailCore(value, options)) throw new TransformationError(`${path} has invalid value`)
				return value
			},
			options: {force}
		}
	}
} as ITransformPlugin
