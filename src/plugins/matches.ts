import TransformationError from '../TransformationError'
import {ITransformer, ITransformOptions} from '../interfaces'

declare module '../transformer' {
	interface ITransformer<T, V> {
		matches(regex: RegExp, opts?: ITransformOptions): ITransformer<T, V>
	}
}

export default <T, V>(middleware: ITransformer<T, V>) => {
	middleware.matches = (regex, transformOption) =>
		middleware.each((value, {path}) => {
				if (typeof value === 'string' && regex.test(value)) return value
				throw new TransformationError(`${path} is not valid`)
			},
			transformOption)
}
