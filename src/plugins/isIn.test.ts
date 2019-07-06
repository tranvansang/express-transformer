/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {NextFunction, Request, Response} from 'express'
import transformer, {transformationResult} from '../transformer'
import {validateTransformation} from '../../test/helper'
import flipPromise from 'flip-promise'

describe('Transform', () => {
  test('isIn', async () => {
    const req = {body: {key: '1'}}
    await combineToAsync(
      transformer('key').isIn(['1', '3']),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)

    ;(transformationResult(req as Request) as Array<any>).splice(0, 1)
    req.body.key = '2'
    await flipPromise(combineToAsync(
      transformer('key').isIn(['1', '3']),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction))

    ;(transformationResult(req as Request) as Array<any>).splice(0, 1)
    delete req.body.key
    await flipPromise(combineToAsync(
      transformer('key').isIn(['1', '3'], {force: true}),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction))

    ;(transformationResult(req as Request) as Array<any>).splice(0, 1)
    delete req.body.key
    await combineToAsync(
      transformer('key').isIn(['1', '3', undefined], {force: true}),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
  })
})
