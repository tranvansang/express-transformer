import {
	IMessageCallback,
	ITransformCallback,
	ITransformCallbackInfo,
	ITransformCallbackPlural,
	ITransformCallbackSingular,
	ITransformerOptions,
	ITransformOptions
} from './interfaces'
import TransformationError from './TransformationError'
// eslint-disable-next-line import/no-extraneous-dependencies
import {Request} from 'express'

export const recursiveSet = <T, V>(obj: T, path: string, value: V) => path
	.split('.')
	.reduce((acc: any, cur: string, index, pathArray) => {
		if (!(acc instanceof Object)) return undefined
		if (index === pathArray.length - 1) acc[cur] = value
		else acc[cur] = Object.prototype.hasOwnProperty.call(acc, cur) ? acc[cur] : {}
		return acc[cur]
	},
	obj || {}
	)
export const recursiveGet = <T, V>(obj: T, path: string, value?: V) => path
	.split('.')
	.reduce((
		acc: any, cur, index, pathArray
	) => acc instanceof Object && Object.prototype.hasOwnProperty.call(acc, cur)
		? acc[cur]
		: index === pathArray.length - 1 ? value : undefined,
	obj
	)
export const recursiveHas = (obj: any, path: string) => {
	for (const key of path.split('.')) if (
		obj instanceof Object && Object.prototype.hasOwnProperty.call(obj, key)
	) {
		obj = obj[key]
	} else return false
	return true
}

/**
 * @param prefix Prefix added so far
 * @param firstArray currently processing array prefix
 * @param arrays remaining array prefixes
 * @param path last path
 * @param callback
 * @param force
 * @returns {Promise<void>}
 */
const subTransform = async <T, V, Options>(
	req: Request,
	location: string,
	message: IMessageCallback<T, Options> | undefined,
	options: ITransformOptions,
	prefix: string[],
	[firstArray, ...arrays]: string[],
	path: string,
	callback: ITransformCallbackSingular<T, V, Options>,
	transformerOptions: Options & ITransformerOptions
) => {
	const {force} = options
	const fullPath = (s: string) => [location, s].join('.')
	const getArrayOrAssignEmpty = (p: string) => {
		//force only effective when value does not exist
		if (!recursiveHas(req, fullPath(p)) && !force) return []
		let values = recursiveGet(req, fullPath(p))
		//always reset existing value regardless force and validateOnly's values
		if (!Array.isArray(values)) {
			values = []
			recursiveSet(req, fullPath(p), [])
		}
		return values
	}
	if (firstArray) {
		prefix = [...prefix, firstArray]
		const values = getArrayOrAssignEmpty(prefix.join('.'))
		for (let i = 0; i < values.length; i++) await subTransform(
			req,
			location,
			message,
			options,
			[...prefix, String(i)],
			arrays,
			path,
			callback,
			transformerOptions
		)
	} else if (/\[]$/.test(path)) { // last selector is an array selector
		path = path.slice(0, path.length - 2)
		const values = getArrayOrAssignEmpty([...prefix, path].join('.'))
		for (let i = 0; i < values.length; i++) await subTransform(
			req,
			location,
			message,
			options,
			prefix,
			arrays,
			[path, i].join('.'),
			callback,
			transformerOptions
		)
	} else {
		path = [...prefix, path].join('.')
		if (force || recursiveHas(req, fullPath(path))) await callback(
			recursiveGet(req, fullPath(path)),
			{options: transformerOptions, path, req}
		)
	}
}

const throwError = async <T, Options>(
	e: Error,
	message: IMessageCallback<T, Options> | undefined,
	value: T | T[],
	info: ITransformCallbackInfo<Options>
) => {
	if (message) {
		if (typeof message === 'function') throw new TransformationError(await message(value, info), info)
		throw new TransformationError(message, info)
	}
	throw e
}

export const doTransform = async <T, V, Options>(
	req: Request,
	location: string,
	path: string | string[],
	callback: ITransformCallback<T, V, Options>,
	options: ITransformOptions = {},
	message: IMessageCallback<T, Options> | undefined,
	transformerOptions: Options & ITransformerOptions
) => {
	const {validateOnly} = options
	const fullPath = (p: string) => [location, p].join('.')
	const makeSub = async (p: string, cb: ITransformCallbackSingular<T, V, Options>) => {
		const arraySplits = p.split('[].') // only split arrays in middle
		await subTransform(
			req,
			location,
			message,
			options,
			[],
			arraySplits.slice(0, arraySplits.length - 1),
			arraySplits[arraySplits.length - 1],
			cb,
			transformerOptions
		)
	}
	if (!Array.isArray(path)) await makeSub(
		path,
		async (value, info) => {
			try {
				const sanitized = await (callback as ITransformCallbackSingular<T, V, Options>)(
					value,
					info
				)
				if (!validateOnly) recursiveSet(req, fullPath(info.path), sanitized)
			} catch (e) {
				await throwError(e, message, value, info)
			}
		}
	)
	else {
		const makeSubLoop = async (index: number, values: T[], paths: string[]) => {
			if (index === path.length) {
				const info = {req, path: paths, options: transformerOptions}
				try {
					const sanitized = await (callback as ITransformCallbackPlural<T, V, Options>)(
						values,
						info
					)
					if (!validateOnly) paths.forEach((p, i) => recursiveSet(
						req,
						fullPath(p),
						(sanitized as V[])?.[i]
					))
				} catch (e) {
					await throwError(e, message, values, info)
				}
			} else await makeSub(path[index], async (value, {path: subPath}) => {
				await makeSubLoop(index + 1, [...values, value], [...paths, subPath])
			})
		}
		await makeSubLoop(0, [], [])
	}
}
