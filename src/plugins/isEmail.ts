import TransformationError from '../TransformationError'
import isEmailCore, {IIsEmailOptions} from './isEmailCore'
import {ITransformCallbackInfo, ITransformOptions, ITransformPlugin} from '../interfaces'

declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			isEmail(
				options?: IIsEmailOptions & Omit<ITransformOptions, 'validateOnly'>
			): ITransformer<T, string, Options>
		}
	}
}

export default {
	name: 'isEmail',
	getConfig(options: IIsEmailOptions & {force?: boolean} = {}) {
		return {
			transform<T, V, Option>(value: T, info: ITransformCallbackInfo<Option>) {
				if (typeof value !== 'string') throw new TransformationError(`${info.path} must be a string`, info)
				if (!isEmailCore(value, options)) throw new TransformationError(`${info.path} has invalid value`, info)
			},
			options: {...options, validateOnly: true}
		}
	}
} as ITransformPlugin
