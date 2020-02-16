import {ITransformOption, Middleware} from '../transformer'
import TransformationError from '../TransformationError'
import isEmailCore, {IIsEmailOptions} from './isEmailCore'

declare module '../transformer' {
	interface Middleware<T, V> {
		isEmail(opts?: IIsEmailOptions): Middleware<string, V>
	}
}

export default <T, V>(middleware: Middleware<string, V>) => {
	middleware.isEmail = (opts?: IIsEmailOptions) =>
		middleware.each((value: string, {path}) => {
			if (!isEmailCore(value)) throw new TransformationError(`${path} has invalid value`)
			return value
		}, opts)

}
