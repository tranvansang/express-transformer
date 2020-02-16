export const transformationErrorName = 'TransformationError'
export default class TransformationError extends Error {
	constructor(message?: string) {
		super(message)
		this.name = transformationErrorName
		Object.setPrototypeOf(this, TransformationError.prototype)
	}
}
