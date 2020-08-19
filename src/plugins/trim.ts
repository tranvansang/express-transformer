import {ITransformer} from '../interfaces'

declare module '../transformer' {
	interface ITransformer<T, V> {
		trim(): ITransformer<T, V>
	}
}

export default <T>(middleware: ITransformer<T, T | string>) => {
	middleware.trim = () =>
		middleware.each(value => {
			if (typeof value === 'string') return value.trim()
			return value
		})
}
