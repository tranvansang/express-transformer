import {ITransformer, ITransformPlugin} from '../interfaces'

declare module '../interfaces' {
	interface ITransformer<T, V, Options> {
		trim(): ITransformer<T, string, Options>
	}
}

export default {
	name: 'trim',
	getConfig() {
		return {
			transform(value) {
				if (typeof value === 'string') return value.trim()
				return value
			},
			options: {force: false, validateOnly: false}
		}
	}
} as ITransformPlugin
