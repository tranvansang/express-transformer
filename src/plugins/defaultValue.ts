import {ITransformer} from '../transformer'

declare module '../transformer' {
	interface ITransformer<T, V> {
		defaultValue(defaultValue: T): ITransformer<T, V>
	}
}

export default <T, V>(middleware: ITransformer<T, V>) => {
	middleware.defaultValue = (defaultValue: T) =>
		middleware.each(
			(value: T) => value === undefined
			|| value as unknown as string === ''
			|| value === null
				? defaultValue
				: value,
			{force: true}
		)
}
