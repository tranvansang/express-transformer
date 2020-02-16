export const transformationErrorName = 'TransformationError'
export default class TransformationError extends Error {
	__proto__: typeof TransformationError.prototype
	constructor(message?: string) {
		super(message)
		this.constructor = TransformationError
		this.__proto__ = TransformationError.prototype
		this.name = transformationErrorName
	}
}
