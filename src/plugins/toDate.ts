import TransformationError from '../TransformationError'
import {ITransformCallbackInfo, ITransformOptions, ITransformPlugin} from '../interfaces'
import {isValidNumber} from '../utils'

type DateInput = Date | string | number | bigint
interface IToDateOptions {
	resetTime?: boolean
	before?: DateInput
	after?: DateInput
	notBefore?: DateInput
	notAfter?: DateInput
	copy?: boolean
}

declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			toDate(
				options?: IToDateOptions & Omit<ITransformOptions, 'validateOnly'>
			): ITransformer<T & Date, V, Options>
		}
	}
}

const toDate = <T>(name: string, value?: T) => {
	if (typeof value === 'undefined') return
	if (
		typeof value !== 'bigint'
		&& typeof value !== 'string'
		&& typeof value !== 'number'
		&& !(value instanceof Date)
	) throw new Error(`${name} must be in date, string, or number format`)
	if (value instanceof Date) {
		if (
			!isValidNumber(value.getTime(), false)
		) throw new Error(`${name} is an invalid Date object`)
		return value
	}
	const time = typeof value === 'string'
		? Date.parse(value as string)
		: typeof value === 'number'
			? new Date(value as number).getTime()
			: new Date(Number(value)).getTime()
	if (
		!isValidNumber(time, false)
	) throw new Error(`${name} cannot be converted to date`)
	return new Date(time)
}

export default {
	name: 'toDate',
	getConfig(
		{
			resetTime,
			before,
			after,
			notAfter,
			notBefore,
			copy,
			...options
		}: IToDateOptions & Omit<ITransformOptions, 'validateOnly'> = {}
	) {
		before = toDate('before', before)
		after = toDate('before', after)
		notBefore = toDate('before', notBefore)
		notAfter = toDate('before', notAfter)
		return {
			transform<T, V, Options>(value: T, info: ITransformCallbackInfo<Options>) {
				if (
					typeof value !== 'bigint'
					&& typeof value !== 'string'
					&& typeof value !== 'number'
					&& !(value instanceof Date)
				) throw new TransformationError(`${info.path} must be in date, string, or number format`, info)
				let date
				if (value instanceof Date) {
					if (
						!isValidNumber(value.getTime(), false)
					) throw new TransformationError(`${info.path} is an invalid date object`, info)
					if (copy) date = new Date(value.getTime())
					else date = value
				} else {
					const time = typeof value === 'string'
						? Date.parse(value as string)
						: typeof value === 'number'
							? new Date(value as number).getTime()
							: new Date(Number(value)).getTime()
					if (
						!isValidNumber(time, false)
					) throw new TransformationError(`${info.path} cannot be converted to Date`, info)
					date = new Date(time)
				}
				if (resetTime) {
					date.setHours(0)
					date.setMinutes(0)
					date.setSeconds(0)
					date.setMilliseconds(0)
				}
				if (
					before && (before as Date).getTime() <= date.getTime()
				) throw new TransformationError(`${info.path} must be before ${(before as Date).toISOString()}`, info)
				if (
					after && (after as Date).getTime() >= date.getTime()
				) throw new TransformationError(`${info.path} must be after ${(after as Date).toISOString()}`, info)
				if (
					notBefore && (notBefore as Date).getTime() > date.getTime()
				) throw new TransformationError(
					`${info.path} must not be before ${(notBefore as Date).toISOString()}`,
					info
				)
				if (
					notAfter && (notAfter as Date).getTime() < date.getTime()
				) throw new TransformationError(
					`${info.path} must not be after ${(notAfter as Date).toISOString()}`,
					info
				)
				return date
			},
			options: {...options, validateOnly: false}
		}
	}
} as ITransformPlugin
