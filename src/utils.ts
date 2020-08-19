import {IMessageCallback, ITransformCallback, ITransformCallbackPlural, ITransformOptions} from './interfaces'
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
export const subTransform = async <T, V>(
	req: Request,
	location: string,
	prefix: string[],
	[firstArray, ...arrays]: string[],
	path: string,
	callback: ITransformCallback<T, V>,
	options: ITransformOptions
) => {
	const {force, validateOnly} = options
	const fullPath = (s: string) => [...prefix, s].join('.')
	const setWithCheck = (p: string, value: V) => void (!validateOnly && recursiveSet(req, fullPath(p), value))
	const processArray = (p: string) => {
		//force only effective when value does not exist
		if (!recursiveHas(req, fullPath(p)) && !force) return []
		let values = recursiveGet(req, fullPath(p))
		//always reset existing value regardless force's value
		if (!Array.isArray(values)) {
			values = []
			setWithCheck(p, [])
		}
		return values
	}
	if (firstArray) {
		prefix = [...prefix, firstArray]
		const values = processArray(prefix.join('.'))
		for (let i = 0; i < values.length; i++) await subTransform(
			req,
			location,
			[...prefix, String(i)],
			arrays,
			path,
			callback,
			options
		)
	} else if (/\[]$/.test(path)) {
		path = [...prefix, path.slice(0, path.length - 2)].join('.')
		const values = processArray(path)
		for (let i = 0; i < values.length; i++) {
			const p = [path, i].join('.')
			const value = recursiveGet(req, fullPath(p))
			const sanitized = await callback(value, {location, path: p, req})
			setWithCheck(p, sanitized)
		}
	} else {
		path = [...prefix, path].join('.')
		if (force || recursiveHas(req, fullPath(path))) {
			const value = recursiveGet(req, fullPath(path))
			const sanitized = await callback(value, {location, path, req})
			setWithCheck(path, sanitized)
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
	const transformCallbackOptions = {req, path, location}
	if (!Array.isArray(path)) {
		const arraySplits = path.split(/\[]\.?/)
		await subTransform(
			req,
			location,
			[],
			arraySplits.slice(0, arraySplits.length - 1),
			arraySplits[arraySplits.length - 1],
			callback,
			options
		)
	} else {
		const fullPath = (p: string) => [location, p].join('.')
		if (force || path.some(p => recursiveHas(req, fullPath(p)))) {
			// if any value exists, process the transformation
			const values = path.map(p => recursiveGet(req, fullPath(p)))
			try {
				const sanitized = (await (callback as ITransformCallbackPlural<T, V>)(values, transformCallbackOptions))
				if (!validateOnly) path.forEach((p, i) => recursiveSet(
					req,
					fullPath(p),
					(sanitized as V[])[i]
				))
			} catch (e) {
				if (message) {
					if (typeof message === 'function') throw message(values, transformCallbackOptions)
					throw new TransformationError(message)
				}
				throw e
			}
		}
	}
}
