/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {NextFunction, Request, Response} from 'express'
import transformer, {transformationResult} from '../transformer'
import {validateTransformation} from '../../test/helper'
import flipPromise from 'flip-promise'

describe('Transform', () => {
  test('should check to float', async () => {
    const req: {body: {key?: number | string}} = {body: {key: '1.5'}}
    await combineToAsync(
      transformer('key').toFloat(),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
    expect(req.body.key).toBe(1.5)

    transformationResult(req as Request).splice(0, 1)
    req.body.key = 12.3
    await combineToAsync(
      transformer('key').toFloat(),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
    expect(req.body.key).toBe(12.3)

    transformationResult(req as Request).splice(0, 1)
    req.body.key = '1.5'
    await flipPromise(combineToAsync(
      transformer('key').toFloat({min: 3}),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction))
    expect(req.body.key).toBe('1.5')

    transformationResult(req as Request).splice(0, 1)
    req.body.key = '1.7'
    await flipPromise(combineToAsync(
      transformer('key').toFloat({max: 0}),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction))
    expect(req.body.key).toBe('1.7')

    transformationResult(req as Request).splice(0, 1)
    req.body.key = undefined
    await flipPromise(combineToAsync(
      transformer('key').toFloat({max: 0}),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction))
    expect(req.body.key).toBeUndefined()

    transformationResult(req as Request).splice(0, 1)
    req.body.key = 'a123'
    await flipPromise(combineToAsync(
      transformer('key').toFloat({max: 0}),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction))
    expect(req.body.key).toBe('a123')

    transformationResult(req as Request).splice(0, 1)
    delete req.body.key
    await combineToAsync(
      transformer('key').toFloat({max: 0}),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
    expect(req.body.key).toBe(undefined)
  })
})
