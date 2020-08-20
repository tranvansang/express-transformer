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
	ITransformPlugin
} from './interfaces'
import {doTransform, recursiveGet, recursiveHas, recursiveSet} from './utils'
import is from './plugins/is'
import isArray from './plugins/isArray'

export {TransformationError, recursiveGet, recursiveSet, recursiveHas}

const plugins = [] as ITransformPlugin[]
export const addTransformerPlugin = (plugin: ITransformPlugin) => void plugins.push(plugin)
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

type PluginName = 'defaultValue'

//NOTE: transformer ignores value that is not provided by default.
//Check their existence via .exists() or set {force: true} option in .transform(callback, options)
export const transformer = <T, V, Options>(
	path: string | string[],
	transformerOptions?: Options & ITransformerOptions
) => {
	if (!transformerOptions) transformerOptions = {} as Options
	if (!transformerOptions.location) transformerOptions.location = 'body'
	const { location = 'body' } = transformerOptions
	const stack: Array<{
		transform: ITransformCallback<T, V, Options>
		message?: IMessageCallback<T, Options>
		options?: ITransformOptions
	}> = []
	const middleware = asyncMiddleware(async (req, res, next) => {
		for (
			const {transform, options, message} of stack
		) await doTransform<T, V, Options>(
			req,
			location,
			path,
			transform,
			options,
			message,
			transformerOptions!
		)
		next()
	}) as ITransformer<T, V, Options>
	middleware.transform = (callback, options) => {
		stack.push({
			options,
			transform: callback
		})
		return middleware
	}
	middleware.message = (message, {force, disableOverwriteWarning} = {}) => {
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
		if (force) for (const transform of stack) if (!transform.message) transform.message = message
		return middleware
	}
	for (
		const {overwriteRootMethods, name, getConfig} of plugins
	) {
		if (!overwriteRootMethods && (name === 'message' || name === 'transform')) {
			throw new Error(`You are going to overwrite the root method ${name}.\
This is disabled by default.\
To force this overwrite, please set overwriteRootMethods option in the plugin object.`)
		}
		middleware[name as PluginName] = <Params extends []>(...params: Params) => {
			const {options, transform} = getConfig(...params)
			return middleware
				.transform(
					(
						value: T | T[],
						info: ITransformCallbackInfo<Options>
					) => transform(value, info) as Promise<T | V | void>,
					options
				)
		}
	}
	return middleware
}
export default transformer
