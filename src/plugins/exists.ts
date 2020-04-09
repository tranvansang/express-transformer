import {ITransformer} from '../transformer'
import TransformationError from '../TransformationError'

declare module '../transformer' {
	interface ITransformer<T, V> {
		exists(opts?: { acceptEmptyString?: boolean }): ITransformer<T, V>
	}
}

export default <T, V>(middleware: ITransformer<T, V>) => {
	middleware.exists = (
		{acceptEmptyString = false}: { acceptEmptyString?: boolean } = {}
	) => middleware.each((value, {path}) => {
		if (
			value === undefined
			|| (!acceptEmptyString && typeof value === 'string' && value === '')
			|| value === null
		) throw new TransformationError(`${path} is required`)
		return value
	}, {force: true})
}
