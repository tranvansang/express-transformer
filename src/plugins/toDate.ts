import {ITransformOption, ITransformer} from '../transformer'
import TransformationError from '../TransformationError'

declare module '../transformer' {
	interface ITransformer<T, V> {
		toDate(opts?: { resetTime?: boolean } & ITransformOption): ITransformer<T, V>
	}
}

export default (middleware: ITransformer<string, Date>) => {
	middleware.toDate = ({resetTime, ...transformOption}: {resetTime?: boolean} & ITransformOption = {}) =>
		middleware.each((value, {path}) => {
				const time = Date.parse(value)
				if (isNaN(time) || !isFinite(time)) throw new TransformationError(`${path} must be in date format`)
				const date = new Date(time)
				if (resetTime) {
					date.setHours(0)
					date.setMinutes(0)
					date.setSeconds(0)
					date.setMilliseconds(0)
				}
				return date
			},
			transformOption)
}
