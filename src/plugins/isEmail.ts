import TransformationError from '../TransformationError'
import isEmailCore, {IIsEmailOptions} from './isEmailCore'
import {ITransformer} from '../interfaces'

declare module '../transformer' {
	interface ITransformer<T, V> {
		isEmail(opts?: IIsEmailOptions): ITransformer<string, V>
	}
}

export default <T, V>(middleware: ITransformer<string, V>) => {
	middleware.isEmail = (opts?: IIsEmailOptions) =>
		middleware.each((value: string, {path}) => {
			if (!isEmailCore(value)) throw new TransformationError(`${path} has invalid value`)
			return value
		}, opts)

}
