import {transformationResult} from '../src/transformer'
import {Request, RequestHandler} from 'express'

export const validateTransformation: RequestHandler = (req, res, next) => {
  const errors = transformationResult(req as Request)
  if (errors.length) next(errors[0].error)
  next()
}
