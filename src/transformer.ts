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
	ITransformCallbackOptions,
	ITransformer,
	ITransformOptions,
	ITransformPlugin
} from './interfaces'
import {doTransform} from './utils'

export {TransformationError}

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

//NOTE: transformer ignores value that is not provided by default.
//Check their existence via .exists() or set {force: true} option in .transform(callback, options)
export const transformer = <T, V>(path: string | string[], { location = 'body' } = {}) => {
	const stack: Array<{
		transform: ITransformCallback<T, V>
		message?: IMessageCallback<T>
		options?: ITransformOptions
	}> = []
	const middleware = asyncMiddleware(async (req, res, next) => {
		for (
			const {transform, options} of stack
		) await doTransform<T, V>(
			req,
			location,
			path,
			transform,
			options
		)
		next()
	}) as ITransformer<T, V>
	middleware.transform = (callback, options = {}) => {
		stack.push({
			options,
			transform: callback
		})
		return middleware
	}
	middleware.message = (message, {force} = {}) => {
		if (stack.length) stack[stack.length - 1].message = message
		if (force) for (const transform of stack) if (!transform.message) transform.message = message
		return middleware
	}
	for (
		const {name, getConfig} of plugins
	) middleware[name] = <Params extends []>(...params: Params) => {
		const {options, transform} = getConfig(...params)
		middleware
			.transform(
				(
					value: T | T[],
					transformCallbackOptions: ITransformCallbackOptions
				) => transform(value, transformCallbackOptions) as Promise<T | V | void>,
				options
			)
	}
	return middleware
}
export default transformer
