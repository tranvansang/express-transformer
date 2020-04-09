import {ITransformOption, ITransformer} from '../transformer'
import TransformationError from '../TransformationError'

declare module '../transformer' {
	interface ITransformer<T, V> {
		matches(regex: RegExp, opts?: ITransformOption): ITransformer<T, V>
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
