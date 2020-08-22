import {
	ITransformCallback,
	ITransformCallbackInfo,
	ITransformCallbackInfoSingular,
	ITransformCallbackSingular,
	ITransformOptions,
	ITransformPlugin
} from '../interfaces'

declare global {
	namespace ExpressTransformer {
		interface ITransformer<T, V, Options> {
			transform(
				callback: ITransformCallback<T, V, Options>,
				options?: ITransformOptions
			): ITransformer<T, V, Options>
		}
	}
}

export default {
	name: 'transform',
	getConfig<T, V, Options>(callback: ITransformCallback<T, V, Options>, options?: ITransformOptions) {
		return {
			transform(value: T | T[], callbackOptions: ITransformCallbackInfo<Options>) {
				return (callback as ITransformCallbackSingular<T, V, Options>)(
					value as T,
					callbackOptions as ITransformCallbackInfoSingular<Options>
				)
			},
			options
		}
	}
} as ITransformPlugin
