import {
	IMessageCallback,
	ITransformCallback,
	ITransformCallbackOptions,
	ITransformCallbackPlural,
	ITransformCallbackSingular,
	ITransformOptions
} from './interfaces'
import TransformationError from './TransformationError'
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
export const recursiveDefault = <T, V>(obj: T, path: string, defaultValue: V) => {
	if (!recursiveHas(obj, path)) recursiveSet(obj, path, defaultValue)
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
const subTransform = async <T, V>(
	req: Request,
	location: string,
	message: IMessageCallback<T> | undefined,
	options: ITransformOptions,
	prefix: string[],
	[firstArray, ...arrays]: string[],
	path: string,
	callback: ITransformCallbackSingular<T, V>,
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
		)
	} else {
		path = [...prefix, path].join('.')
		if (force || recursiveHas(req, fullPath(path))) await callback(
			recursiveGet(req, fullPath(path)),
			{location, path, req}
		)
	}
}

const throwError = async <T>(
	e: Error,
	message: IMessageCallback<T> | undefined,
	value: T | T[],
	transformCallbackOptions: ITransformCallbackOptions
) => {
	if (message) {
		if (typeof message === 'function') throw new TransformationError(await message(value, transformCallbackOptions))
		throw new TransformationError(message)
	}
	throw e
}

export const doTransform = async <T, V>(
	req: Request,
	location: string,
	path: string | string[],
	callback: ITransformCallback<T, V>,
	options: ITransformOptions = {},
	message?: IMessageCallback<T>
) => {
	const {validateOnly} = options
	const fullPath = (p: string) => [location, p].join('.')
	const makeSub = async (p: string, cb: ITransformCallbackSingular<T, V>) => {
		const arraySplits = p.split('[].') // only split arrays in middle
		await subTransform(
			req,
			location,
			message,
			options,
			[],
			arraySplits.slice(0, arraySplits.length - 1),
			arraySplits[arraySplits.length - 1],
			cb
		)
	}
	if (!Array.isArray(path)) await makeSub(
		path,
		async (value, transformCallbackOptions) => {
			try {
				const sanitized = await (callback as ITransformCallbackSingular<T, V>)(
					value,
					transformCallbackOptions
				)
				if (!validateOnly) recursiveSet(req, fullPath(transformCallbackOptions.path), sanitized)
			} catch (e) {
				await throwError(e, message, value, transformCallbackOptions)
			}
		}
	)
	else {
		const makeSubLoop = async (index: number, values: T[], paths: string[]) => {
			if (index === path.length) {
				const transformCallbackOptions = {req, path: paths, location}
				try {
					const sanitized = await (callback as ITransformCallbackPlural<T, V>)(
						values,
						transformCallbackOptions
					)
					if (!validateOnly) paths.forEach((p, i) => recursiveSet(
						req,
						fullPath(p),
						(sanitized as V[])?.[i]
					))
				} catch (e) {
					await throwError(e, message, values, transformCallbackOptions)
				}
			} else await makeSub(path[index], async (value, {path: subPath}) => {
				await makeSubLoop(index + 1, [...values, value], [...paths, subPath])
			})
		}
		await makeSubLoop(0, [], [])
	}
}
