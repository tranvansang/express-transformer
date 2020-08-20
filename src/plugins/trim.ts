import {ITransformPlugin} from '../interfaces'

declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			trim(): ITransformer<T, V, Options>
		}
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
