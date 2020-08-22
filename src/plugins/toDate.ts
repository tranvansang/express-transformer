import TransformationError from '../TransformationError'
import {ITransformCallbackInfo, ITransformOptions, ITransformPlugin} from '../interfaces'

declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			toDate(options?: {
				resetTime?: boolean
			} & Omit<ITransformOptions, 'validateOnly'>): ITransformer<T, Date, Options>
		}
	}
}

export default {
	name: 'toDate',
	getConfig({resetTime, ...options}: {
		resetTime?: boolean
	} & Omit<ITransformOptions, 'validateOnly'> = {}) {
		return {
			transform<T, V, Options>(value: T, info: ITransformCallbackInfo<Options>) {
				if (
					typeof value !== 'bigint'
					&& typeof value !== 'string'
					&& typeof value !== 'number'
					&& !(value instanceof Date)
				) throw new TransformationError(`${info.path} must be in date, string, or number format`, info)
				const time = value instanceof Date
					? value.getTime()
					: typeof value === 'string'
						? Date.parse(value as string)
						: typeof value === 'number'
							? new Date(value as number).getTime()
							: new Date(Number(value)).getTime()
				if (
					isNaN(time) || !isFinite(time)
				) throw new TransformationError(`${info.path} must be in date format`, info)
				const date = new Date(time)
				if (resetTime) {
					date.setHours(0)
					date.setMinutes(0)
					date.setSeconds(0)
					date.setMilliseconds(0)
				}
				return date
			},
			options: {...options, validateOnly: false}
		}
	}
} as ITransformPlugin
