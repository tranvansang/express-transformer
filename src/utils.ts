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

// mostly clone the implementation of subTransform
// check and fix the data shape
const validateDataShape = <Options>(
	req: Request,
	locationSplits: string[],
	prefixes: Array<string | number>,
	[firstArray, ...arrays]: string[],
	lastPath: string | number,
	transformerOptions: Options & ITransformerOptions,
	options: ITransformOptions
) => {
	const {force} = options
	const {rawPath, disableArrayNotation} = transformerOptions
	if (firstArray) {
		const newPrefixes = [...prefixes, ...splitPath(!!rawPath, firstArray)]
		const values = getArrayOrAssignEmpty(req, [...locationSplits, ...newPrefixes], !!force)
		for (let i = 0; i < values.length; i++) if (validateDataShape(
			req,
			locationSplits,
			[...newPrefixes, i],
			arrays,
			lastPath,
			transformerOptions,
			options
		)) return true
		return false
	}
	if (!disableArrayNotation && typeof lastPath !== 'number' && /\[]$/.test(lastPath)) {
		// last selector is an array selector
		const lastPathBase = lastPath.slice(0, lastPath.length - 2)
		const newPrefixes = [...prefixes, ...splitPath(!!rawPath, lastPathBase)]
		const values = getArrayOrAssignEmpty(req, [...locationSplits, ...newPrefixes], !!force)
		// to achieve a 100% coverage, change to the following
		// values.length && doesValueExist(..., String(0), ...)
		for (let i = 0; i < values.length; i++) if (validateDataShape(
			req,
			locationSplits,
			[...prefixes, ...splitPath(!!rawPath, lastPathBase)],
			arrays,
			i,
			transformerOptions,
			options
		)) return true
		return false
	}
	return recursiveHas(req, [...locationSplits, ...prefixes, lastPath])
}

/**
 * @param prefixes Prefix added so far
 * @param firstArray currently being processed array prefix
 * @param arrays the remaining array prefixes
 * @param lastPath last path
 */
const subTransform = async <T, V, Options>(
	req: Request,
	locationSplits: string[],
	prefixes: Array<string | number>,
	[firstArray, ...arrays]: string[],
	lastPath: string | number,
	transformerOptions: Options & ITransformerOptions,
	options: ITransformOptions,
	callback: ITransformCallbackSingular<T, V, Options>,
	message: IMessageCallback<T, Options> | undefined
) => {
	const {force} = options
	const {rawPath, disableArrayNotation} = transformerOptions
	if (firstArray) {
		const newPrefixes = [...prefixes, ...splitPath(!!rawPath, firstArray)]
		const values = getArrayOrAssignEmpty(req, [...locationSplits, ...newPrefixes], !!force)
		for (let i = 0; i < values.length; i++) await subTransform(
			req,
			locationSplits,
			[...newPrefixes, i],
			arrays,
			lastPath,
			transformerOptions,
			options,
			callback,
			message,
		)
	} else if (!disableArrayNotation && typeof lastPath !== 'number' && /\[]$/.test(lastPath)) {
		// last selector is an array selector
		const lastPathBase = lastPath.slice(0, lastPath.length - 2)
		const lastPathBaseSplits = splitPath(!!rawPath, lastPathBase)
		const values = getArrayOrAssignEmpty(
			req,
			[...locationSplits, ...prefixes, ...lastPathBaseSplits],
			!!force
		)
		for (let i = 0; i < values.length; i++) await subTransform(
			req,
			locationSplits,
			[...prefixes, ...lastPathBaseSplits],
			arrays,
			i,
			transformerOptions,
			options,
			callback,
			message,
		)
	} else {
		const newSplits = [...prefixes, ...splitPath(!!rawPath, lastPath)]
		const fullSplits = [...locationSplits, ...newSplits]
		if (force || recursiveHas(req, fullSplits)) await callback(
			recursiveGet(req, fullSplits),
			{
				options: transformerOptions,
				path: joinSplits(newSplits),
				pathSplits: newSplits,
				req}
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
	const {validateOnly, force} = options
	const {disableArrayNotation, rawPath, rawLocation} = transformerOptions
	const locationSplits = splitPath(!!rawLocation, location)
	const makeSub = async (
		subPath: string,
		cb: ITransformCallbackSingular<T, V, Options>,
		transformOptions: ITransformOptions
	) => {
		const subPathArrays = disableArrayNotation ? [subPath] : subPath.split('[].') // only split arrays in middle
		await subTransform(
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
			} catch (e) {
				await throwError(e, message, value, info)
			}
		},
		options
	)
	else {
		// only allow skip if there is no value exists
		const anyExist = path.map(subPath => {
			const subPathArrays = disableArrayNotation ? [subPath] : subPath.split('[].') // only split arrays in middle
			return validateDataShape(
				req,
				locationSplits,
				[],
				subPathArrays.slice(0, subPathArrays.length - 1),
				subPathArrays[subPathArrays.length - 1],
				transformerOptions,
				options
			)
		}).some(Boolean)
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
				},
				transformOptions
			)
		}
		await makeSubLoop(0, [], [], [])
	}
}
