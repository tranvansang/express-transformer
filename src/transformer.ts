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
	IMessageCallback,
	ITransformCallback,
	ITransformCallbackInfo,
	ITransformer,
	ITransformerOptions,
	ITransformOptions,
	ITransformPlugin,
	ITransformPluginConfig
} from './interfaces'
import {doTransform, recursiveGet, recursiveHas, recursiveSet} from './utils'
import is from './plugins/is'
import isArray from './plugins/isArray'
import isType from './plugins/isType'
import transform from './plugins/transform'
import use from './plugins/use'
import plugins from './plugins'

export {
	TransformationError,
	recursiveGet,
	recursiveSet,
	recursiveHas,
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

//NOTE: transformer ignores value that is not provided by default.
//Check their existence via .exists() or set {force: true} option in .transform(callback, options)
export const transformer = <T, V, Options>(
	path: string | string[],
	transformerOptions?: Options & ITransformerOptions
) => {
	const nonNullTransformerOptions = transformerOptions || {} as Options & ITransformerOptions
	if (!nonNullTransformerOptions.location) nonNullTransformerOptions.location = 'body'
	const { location } = nonNullTransformerOptions
	const stack: Array<{
		callback: ITransformCallback<T, V, Options>
		message?: IMessageCallback<T, Options>
		options?: ITransformOptions
	}> = []
	const addPluginConfig = (config: ITransformPluginConfig) => {
		const {options, transform: cb} = config
		stack.push({
			callback: (
				value: T | T[],
				info: ITransformCallbackInfo<Options>
			) => cb(value, info) as Promise<T | V | void>,
			options
		})
	}
	const middleware = asyncMiddleware(async (req, res, next) => {
		for (
			const {callback, options, message} of stack
		) await doTransform(
			req,
			location,
			path,
			callback,
			options,
			message,
			nonNullTransformerOptions
		)
		next()
	}) as ITransformer<T, V, Options>
	middleware.message = (
		message,
		{global, disableOverwriteWarning} = {}
	) => {
		if (stack.length) {
			if (stack[stack.length - 1].message) {
				// eslint-disable-next-line no-console
				if (!disableOverwriteWarning) console.warn(
					'You are specify the .message twice for a same transformation.'
					+ ' Only the last .message is applied.'
					+ ' To disable this warning, please set disableOverwriteWarning in the option.'
				)
			}
			stack[stack.length - 1].message = message
		}
		if (global) for (const transformation of stack) if (!transformation.message) transformation.message = message
		return middleware
	}
	for (
		const {name, getConfig} of plugins
	) middleware[name as PluginName] = <Params extends []>(...params: Params) => {
		const configs = getConfig(...params)
		if (Array.isArray(configs)) configs.map(addPluginConfig)
		else addPluginConfig(configs)
		return middleware
	}
	return middleware
}
export default transformer
