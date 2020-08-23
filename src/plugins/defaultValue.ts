import {ITransformPlugin} from '../interfaces'

declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			defaultValue(defaultValue: T, options?: {ignoreEmptyString?: boolean}): ITransformer<T, T | V, Options>
		}
	}
}

export default {
	name: 'defaultValue',
	getConfig<T>(defaultValue: T, {ignoreEmptyString}: {ignoreEmptyString?: boolean} = {}) {
		return {
			transform(value) {
				return value === undefined
				|| (!ignoreEmptyString && value as unknown as string === '')
				|| value === null
					? defaultValue
					: value
			},
			options: {force: true, validateOnly: false}
		}
	}
} as ITransformPlugin
