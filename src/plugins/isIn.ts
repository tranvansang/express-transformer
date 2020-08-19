import TransformationError from '../TransformationError'
import {ITransformer, ITransformOptions} from '../interfaces'

declare module '../transformer' {
	interface ITransformer<T, V> {
		isIn(values: ReadonlyArray<T>, opts?: ITransformOptions): ITransformer<T, V>
	}
}

export default <T, V>(middleware: ITransformer<T, V>) => {
	middleware.isIn = (values: ReadonlyArray<T>, opts?: ITransformOptions) =>
		middleware.each((value: T, {path}) => {
			if (!values.includes(value)) throw new TransformationError(`${path} has invalid value`)
			return value
		}, opts)

}
