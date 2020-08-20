import TransformationError from '../TransformationError'
import {ITransformer, ITransformPlugin} from '../interfaces'

declare module '../interfaces' {
	interface ITransformer<T, V, Options> {
		toDate(options?: {
			resetTime?: boolean
			force?: boolean
		}): ITransformer<string | number, Date, Options>
	}
}

export default {
	name: 'toDate',
	getConfig({force, resetTime}: {
		resetTime?: boolean
		force?: boolean
	} = {}) {
		return {
			transform(value: string | number, info) {
				const time = typeof value === 'string' ? Date.parse(value) : new Date(value).getTime()
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
			options: {force, validateOnly: false}
		}
	}
} as ITransformPlugin
