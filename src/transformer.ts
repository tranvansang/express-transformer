import TransformationError from './TransformationError'
import exists from './plugins/exists'
// import isIn from './plugins/isIn'
// import isLength from './plugins/isLength'
// import matches from './plugins/matches'
// import toDate from './plugins/toDate'
// import toFloat from './plugins/toFloat'
// import toInt from './plugins/toInt'
// import trim from './plugins/trim'
// import defaultValue from './plugins/defaultValue'
// import isEmail from './plugins/isEmail'
import asyncMiddleware from 'middleware-async'
import {ITransformCallback, IMessageCallback, ITransformer, ITransformOptions, ITransformPlugin} from './interfaces'
import {doTransform} from './utils'

export {TransformationError}

const plugins = [] as ITransformPlugin[]

// exists,
// 	isIn,
// 	isEmail,
// 	isLength,
// 	matches,
// 	toDate,
// 	toFloat,
// 	toInt,
// 	trim,
// 	defaultValue,

export const addTransformerPlugin = (plugin: ITransformPlugin) => void plugins.push(plugin)

addTransformerPlugin(exists)

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
		const {name, transform, options} of plugins
	) middleware[name] = <Options>(pluginOptions: Options) => middleware
		.transform((...params) => transform<Options, T, V>(pluginOptions)(...params), options)
	return middleware
}
export default transformer
