import {IMessageCallback, ITransformation, ITransformPlugin} from '../interfaces'

type IMessageOptions = {
	global?: boolean
	disableOverwriteWarning?: boolean
}

declare global {
	namespace ExpressTransformer {
		interface ITransformer<T, V, Options> {
			message(
				callback: IMessageCallback<T, Options>,
				options?: IMessageOptions
			): ITransformer<T, V, Options>
		}
	}
}

export default {
	name: 'message',
	getConfig<T, V, Options>(
		callback: IMessageCallback<T, Options>,
		{global, disableOverwriteWarning}: IMessageOptions = {}
	) {
		return {
			updateStack(stack: ITransformation<T, V, Options>[]) {
				if (stack.length) {
					if (stack[stack.length - 1].message) {
						// eslint-disable-next-line no-console
						if (!disableOverwriteWarning) console.warn(
							'You are specify the .message twice for a same transformation.'
							+ ' Only the last .message is applied.'
							+ ' To disable this warning, please set disableOverwriteWarning in the option.'
						)
					}
					stack[stack.length - 1].message = callback
				}
				if (global) for (
					const transformation of stack
				) if (!transformation.message) transformation.message = callback
			}
		}
	}
} as ITransformPlugin
