import {TransformationError, transformationResult} from '../src/transformer'

export const validateTransformation = (req, res, next) => {
  const errors = transformationResult(req)
  if (errors.length) {
    let error = errors[0].error
    if (error instanceof TransformationError)
      error = error.message
    return next(error)
  }
  next()
}
