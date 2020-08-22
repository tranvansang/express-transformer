import {ITransformPlugin, ITransformer} from '../interfaces'
import allPlugins from '.'

// type RecursiveArray<T> = T | RecursiveArraySub<T>
// type RecursiveArraySub<T> = Array<RecursiveArray<T>>

declare global {
	namespace ExpressTransformer {
		interface ITransformer<T, V, Options> {
			use(
				plugins: Array<[ITransformPlugin | keyof ITransformer<T, V, Options>, ...any[]]>
			): ITransformer<T, V, Options>
		}
	}
}

export default {
	name: 'use',
	getConfig<T, V, Options>(plugins: Array<[ITransformPlugin | keyof ITransformer<T, V, Options>, ...any[]]>) {
		return plugins.map(([plugin, ...params]) => {
			if (typeof plugin === 'string') {
				for (const plg of allPlugins) if (plg.name === plugin) return plg.getConfig<any>(...params)
				throw new Error(`Plugin ${plugin} does not exist`)
			}
			return plugin.getConfig<any>(...params)
		})
	}
} as ITransformPlugin
