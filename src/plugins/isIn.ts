import {ITransformOption, ITransformer} from '../transformer'
import TransformationError from '../TransformationError'

declare module '../transformer' {
	interface ITransformer<T, V> {
		isIn(values: ReadonlyArray<T>, opts?: ITransformOption): ITransformer<T, V>
	}
}

export default <T, V>(middleware: ITransformer<T, V>) => {
	middleware.isIn = (values: ReadonlyArray<T>, opts?: ITransformOption) =>
		middleware.each((value: T, {path}) => {
			if (!values.includes(value)) throw new TransformationError(`${path} has invalid value`)
			return value
		}, opts)

}
