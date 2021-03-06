import TransformationError from '../TransformationError'
import isEmailCore, {IIsEmailOptions} from './isEmailCore'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {ITransformCallbackInfo, ITransformOptions, ITransformPlugin} from '../interfaces'

declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			isEmail(
				options?: IIsEmailOptions & Omit<ITransformOptions, 'validateOnly'>
			): ITransformer<T & string, V, Options>
		}
	}
}

export default {
	name: 'isEmail',
	getConfig(options: IIsEmailOptions & {force?: boolean} = {}) {
		return {
			transform<T, V, Options>(value: T, info: ITransformCallbackInfo<Options>) {
				if (typeof value !== 'string') throw new TransformationError(`${info.path} must be a string`, info)
				if (!isEmailCore(value, options)) throw new TransformationError(`${info.path} has invalid value`, info)
			},
			options: {...options, validateOnly: true}
		}
	}
} as ITransformPlugin
