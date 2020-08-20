import {ITransformPlugin} from '../interfaces'

declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			defaultValue(defaultValue: T): ITransformer<T, T | V, Options>
		}
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
