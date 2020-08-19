import {ITransformer, ITransformPlugin} from '../interfaces'

declare module '../interfaces' {
	interface ITransformer<T, V> {
		defaultValue(defaultValue: T): ITransformer<T, T | V>
	}
}

export default {
	name: 'defaultValue',
	getConfig<T>(defaultValue: T) {
		return {
			transform(value) {
				return value === undefined
				|| value as unknown as string === ''
				|| value === null
					? defaultValue
					: value
			},
			options: {force: true, validateOnly: false}
		}
	}
} as ITransformPlugin
