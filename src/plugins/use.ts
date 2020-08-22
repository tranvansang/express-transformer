import {
	ITransformCallback,
	ITransformCallbackInfo,
	ITransformCallbackInfoSingular,
	ITransformCallbackSingular,
	ITransformOptions,
	ITransformPlugin
} from '../interfaces'

// type RecursiveArray<T> = T | RecursiveArraySub<T>
// type RecursiveArraySub<T> = Array<RecursiveArray<T>>

declare global {
	namespace ExpressTransformer {
		interface ITransformer<T, V, Options> {
			use(plugins: Array<[ITransformPlugin, ...any[]]>): ITransformer<T, V, Options>
		}
	}
}

export default {
	name: 'use',
	getConfig<T, V, Options>(plugins: Array<[ITransformPlugin, ...any[]]>) {
		return plugins.map(([plugin, ...params]) => plugin.getConfig<any>(...params))
	}
} as ITransformPlugin
