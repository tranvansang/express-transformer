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

export const recursiveSet = <T, V>(obj: T, pathSplits: Array<string | number>, value: V) => pathSplits
	.reduce((acc: any, cur: string | number, index, pathArray) => {
		if (!(acc instanceof Object)) return undefined
		if (index === pathArray.length - 1) acc[cur] = value
		else acc[cur] = Object.prototype.hasOwnProperty.call(acc, cur) ? acc[cur] : {}
		return acc[cur]
	},
	obj || {})
export const recursiveGet = <T, V>(obj: T, pathSplits: Array<string | number>, defaultValue?: V) => pathSplits
	.reduce((
		acc: any, cur, index, pathArray
	) => acc instanceof Object && Object.prototype.hasOwnProperty.call(acc, cur)
		? acc[cur]
		: index === pathArray.length - 1 ? defaultValue : undefined,
	obj)
export const recursiveHas = (obj: any, pathSplits: Array<string | number>) => {
	for (const key of pathSplits) if (
		obj instanceof Object && Object.prototype.hasOwnProperty.call(obj, key)
	) obj = obj[key]
	else return false
	return true
}

const splitPath = <T extends string | number>(raw: boolean, path: T) => typeof path === 'number' || raw
	? [path]
	: (path as string).split('.')

const joinSplits = (splits: Array<string | number>) => splits.map(
	(
		subPath,
		index,
	) => `${typeof subPath === 'string' && index ? '.' : ''}${typeof subPath === 'number' ? `[${subPath}]` : subPath}`
).join('')

const getArrayOrAssignEmpty = (
	obj: any,
	pathSplits: Array<string | number>,
	force: boolean,
) => {
	//force only becomes effective when value does not exist
	if (!recursiveHas(obj, pathSplits) && !force) return []
	let values = recursiveGet(obj, pathSplits)
	if (!Array.isArray(values)) {
		// values has a malformed data type
		// always reset it regardless of force and validateOnly
		values = []
		recursiveSet(obj, pathSplits, values)
	}
	return values
}

/**
 * @param prefixes Prefix added so far
 * @param firstArray currently being processed array prefix
 * @param arrays the remaining array prefixes
 * @param lastPath last path
 */
const iterateObject = async <T, V, Options>(
	req: Request,
	locationSplits: string[],
	prefixes: Array<string | number>,
	[firstArray, ...arrays]: string[],
	lastPath: string | number,
	transformerOptions: Options & ITransformerOptions,
	options: ITransformOptions,
	callback: ITransformCallbackSingular<T, boolean, Options>,
	message?: IMessageCallback<T, Options> | undefined
) => {
	const {force} = options
	const {rawPath, disableArrayNotation} = transformerOptions
	if (firstArray) {
		const newPrefixes = [...prefixes, ...splitPath(!!rawPath, firstArray)]
		const values = getArrayOrAssignEmpty(req, [...locationSplits, ...newPrefixes], !!force)
		for (let i = 0; i < values.length; i++) if (!await iterateObject(
			req,
			locationSplits,
			[...newPrefixes, i],
			arrays,
			lastPath,
			transformerOptions,
			options,
			callback,
			message,
		)) return false
		return true
	}
	if (!disableArrayNotation && typeof lastPath !== 'number' && /\[]$/.test(lastPath)) {
		// last selector is an array selector
		const lastPathBase = lastPath.slice(0, lastPath.length - 2)
		const newPrefixes = [...prefixes, ...splitPath(!!rawPath, lastPathBase)]
		const values = getArrayOrAssignEmpty(
			req,
			[...locationSplits, ...newPrefixes],
			!!force
		)
		for (let i = 0; i < values.length; i++) if (!await iterateObject(
			req,
			locationSplits,
			newPrefixes,
			arrays,
			i,
			transformerOptions,
			options,
			callback,
			message,
		)) return false
		return true
	}
	const newSplits = [...prefixes, ...splitPath(!!rawPath, lastPath)]
	const fullSplits = [...locationSplits, ...newSplits]
	return force || recursiveHas(req, fullSplits)
		? await callback(
			recursiveGet(req, fullSplits),
			{
				options: transformerOptions,
				path: joinSplits(newSplits),
				pathSplits: newSplits,
				req}
		)
		: false
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
	const {validateOnly, force} = options
	const {disableArrayNotation, rawPath, rawLocation} = transformerOptions
	const locationSplits = splitPath(!!rawLocation, location)
	const makeSub = async (
		subPath: string,
		cb: ITransformCallbackSingular<T, boolean, Options>,
		transformOptions: ITransformOptions
	) => {
		const subPathArrays = disableArrayNotation ? [subPath] : subPath.split('[].') // only split arrays in middle
		await iterateObject(
			req,
			locationSplits,
			[],
			subPathArrays.slice(0, subPathArrays.length - 1),
			subPathArrays[subPathArrays.length - 1],
			transformerOptions,
			transformOptions,
			cb,
			message,
		)
	}
	if (!Array.isArray(path)) await makeSub(
		path,
		async (value, info) => {
			try {
				const transformedValue = await (callback as ITransformCallbackSingular<T, V, Options>)(
					value,
					info
				)
				if (!validateOnly) recursiveSet(
					req,
					[...locationSplits, ...info.pathSplits],
					transformedValue
				)
				return true
			} catch (e) {
				await throwError(e, message, value, info)
			}
		},
		options
	)
	else {
		let anyExist = false
		for (const subPath of path) {
			const subPathArrays = disableArrayNotation ? [subPath] : subPath.split('[].') // only split arrays in middle
			if (await iterateObject(
				req,
				locationSplits,
				[],
				subPathArrays.slice(0, subPathArrays.length - 1),
				subPathArrays[subPathArrays.length - 1],
				transformerOptions,
				options,
				() => true
			)) anyExist = true
		}
		// only allow skip if there is no value exists
		const transformOptions = !force && anyExist
			? {...options, force: true}
			: options
		const makeSubLoop = async (
			index: number,
			values: T[],
			paths: string[],
			pathSplitsAll: Array<Array<string | number>>
		) => {
			if (index === path.length) {
				const info = {
					req,
					path: paths,
					options: transformerOptions,
					pathSplits: pathSplitsAll
				}
				try {
					const transformedValues = await (callback as ITransformCallbackPlural<T, V, Options>)(
						values,
						info
					)
					if (!validateOnly) paths.forEach((subPath, i) => recursiveSet(
						req,
						[...locationSplits, ...splitPath(!!rawPath, subPath)],
						(transformedValues as V[])?.[i]
					))
				} catch (e) {
					await throwError(e, message, values, info)
				}
			} else await makeSub(
				path[index],
				async (value, {path: subPath, pathSplits}) => {
					await makeSubLoop(
						index + 1,
						[...values, value],
						[...paths, subPath],
						[...pathSplitsAll, pathSplits]
					)
					return true
				},
				transformOptions
			)
		}
		await makeSubLoop(0, [], [], [])
	}
}
