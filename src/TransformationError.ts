export default class TransformationError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'TransformationError'
  }
}
