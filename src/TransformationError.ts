import {ITransformCallbackInfo} from './interfaces'

export const transformationErrorName = 'TransformationError'
export default class TransformationError<Options> extends Error {
	constructor(message: string, public info: ITransformCallbackInfo<Options>) {
		super(message)
		this.name = transformationErrorName
		Object.setPrototypeOf(this, TransformationError.prototype)
	}
}
