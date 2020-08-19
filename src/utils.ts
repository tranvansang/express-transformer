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
	callback: ITransformCallbackSingular<T, V>,
	message: IMessageCallback<T> | undefined,
	options: ITransformOptions,
	prefix: string[],
	[firstArray, ...arrays]: string[],
	path: string,
) => {
	const {force, validateOnly} = options
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
			callback,
			message,
			options,
			[...prefix, String(i)],
			arrays,
			path
		)
	} else if (/\[]$/.test(path)) { // last selector is an array selector
		path = path.slice(0, path.length - 2)
		const values = getArrayOrAssignEmpty([...prefix, path].join('.'))
		for (let i = 0; i < values.length; i++) await subTransform(
			req,
			location,
			callback,
			message,
			options,
			prefix,
			arrays,
			[path, i].join('.')
		)
	} else {
		path = [...prefix, path].join('.')
		if (force || recursiveHas(req, fullPath(path))) {
			const value = recursiveGet(req, fullPath(path))
			const transformCallbackOptions = {location, path, req}
			try {
				const sanitized = await callback(value, transformCallbackOptions)
				if (!validateOnly) recursiveSet(req, fullPath(path), sanitized)
			} catch (e) {
				await throwError(e, message, value, transformCallbackOptions)
			}
		}
	}
}

export const doTransform = async <T, V>(
	req: Request,
	location: string,
	path: string | string[],
	callback: ITransformCallback<T, V>,
	options: ITransformOptions = {},
	message?: IMessageCallback<T>
) => {
	const {force, validateOnly} = options
	if (!Array.isArray(path)) {
		const arraySplits = path.split(/\[]\./) // only split arrays in middle
		await subTransform(
			req,
			location,
			callback as ITransformCallbackSingular<T, V>,
			message,
			options,
			[],
			arraySplits.slice(0, arraySplits.length - 1),
			arraySplits[arraySplits.length - 1],
		)
	} else {
		const fullPath = (p: string) => [location, p].join('.')
		const transformCallbackOptions = {req, path, location}
		if (force || path.some(p => recursiveHas(req, fullPath(p)))) {
			// if any value exists, process the transformation
			const values = path.map(p => recursiveGet(req, fullPath(p)))
			try {
				const sanitized = await (callback as ITransformCallbackPlural<T, V>)(values, transformCallbackOptions)
				if (!validateOnly) path.forEach((p, i) => recursiveSet(
					req,
					fullPath(p),
					(sanitized as V[])?.[i]
				))
			} catch (e) {
				await throwError(e, message, values, transformCallbackOptions)
			}
		}
	}
}
