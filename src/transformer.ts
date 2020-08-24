import TransformationError from './TransformationError'
import exists from './plugins/exists'
import isIn from './plugins/isIn'
import isLength from './plugins/isLength'
import matches from './plugins/matches'
import toDate from './plugins/toDate'
import toFloat from './plugins/toFloat'
import toInt from './plugins/toInt'
import trim from './plugins/trim'
import defaultValue from './plugins/defaultValue'
import isEmail from './plugins/isEmail'
import asyncMiddleware from 'middleware-async'
import {
	ITransformation,
	ITransformCallbackInfo,
	ITransformer,
	ITransformerOptions,
	ITransformPlugin,
	ITransformPluginConfig,
	MaybeArray
} from './interfaces'
import {doTransform, recursiveGet, recursiveHas, recursiveSet} from './utils'
import is from './plugins/is'
import isArray from './plugins/isArray'
import isType from './plugins/isType'
import transform from './plugins/transform'
import use from './plugins/use'
import plugins from './plugins'
import message from './plugins/message'

export {
	TransformationError,
	recursiveGet,
	recursiveSet,
	recursiveHas,
	message,
	transform,
	exists,
	isIn,
	isEmail,
	isLength,
	matches,
	toDate,
	toFloat,
	toInt,
	trim,
	defaultValue,
	is,
	isArray,
	isType,
	use
}

export const addTransformerPlugin = (plugin: ITransformPlugin) => {
	const {name} = plugin
	if (!name) throw new Error('Plugin name is required')
	plugins.push(plugin)
}

addTransformerPlugin(message)
addTransformerPlugin(transform)
addTransformerPlugin(use)
addTransformerPlugin(exists)
addTransformerPlugin(isIn)
addTransformerPlugin(isEmail)
addTransformerPlugin(isLength)
addTransformerPlugin(matches)
addTransformerPlugin(toDate)
addTransformerPlugin(toFloat)
addTransformerPlugin(toInt)
addTransformerPlugin(trim)
addTransformerPlugin(defaultValue)
addTransformerPlugin(is)
addTransformerPlugin(isArray)
addTransformerPlugin(isType)

type PluginName = 'defaultValue'

export const transformer = <T, V, Options>(
	path: string | string[],
	transformerOptions?: Options & ITransformerOptions
) => {
	transformerOptions ||= {} as Options & ITransformerOptions
	transformerOptions.location ||= 'body'
	const { location } = transformerOptions
	const stack = [] as ITransformation<T, V, Options>[]
	const middleware = asyncMiddleware(async (req, res, next) => {
		for (
			const {callback, options, message: msg} of stack
		) await doTransform(
			req,
			location,
			path,
			callback,
			options,
			msg,
			transformerOptions!
		)
		next()
	}) as ITransformer<T, V, Options>
	const addPluginConfig = (configs: MaybeArray<ITransformPluginConfig>) => {
		if (Array.isArray(configs)) for (const config of configs) addPluginConfig(config)
		else {
			const {options, transform: cb, updateStack} = configs
			updateStack?.(stack)
			if (cb) stack.push({
				callback: (
					value: T | T[],
					info: ITransformCallbackInfo<Options>
				) => cb(value, info) as Promise<T | V | void>,
				options
			})
		}
	}
	for (
		const {name, getConfig} of plugins
	) middleware[name as PluginName] = <Params extends []>(...params: Params) => {
		addPluginConfig(getConfig(...params))
		return middleware
	}
	return middleware
}
export default transformer
