/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {NextFunction, Request, Response} from 'express'
import transformer, {transformationResult} from '../transformer'
import {validateTransformation} from '../testHelper'
import flipPromise from 'flip-promise'

describe('Transform', () => {
  test('should check to int', async () => {
    const req: {body: {key: string | number}} = {body: {key: '1'}}
    await combineToAsync(
      transformer('key').toInt(),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
    expect(req.body.key).toBe(1)

    ;(transformationResult(req as Request) as Array<any>).splice(0, 1)
    req.body.key = 12
    await combineToAsync(
      transformer('key').toInt(),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
    expect(req.body.key).toBe(12)

    ;(transformationResult(req as Request) as Array<any>).splice(0, 1)
    req.body.key = '1.2'
    await combineToAsync(
      transformer('key').toInt(),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
    expect(req.body.key).toBe(1)

    ;(transformationResult(req as Request) as Array<any>).splice(0, 1)
    req.body.key = '1'
    await flipPromise(combineToAsync(
      transformer('key').toInt({min: 3}),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction))
    expect(req.body.key).toBe('1')

    ;(transformationResult(req as Request) as Array<any>).splice(0, 1)
    req.body.key = '1'
    await flipPromise(combineToAsync(
      transformer('key').toInt({max: 0}),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction))
    expect(req.body.key).toBe('1')

    ;(transformationResult(req as Request) as Array<any>).splice(0, 1)
    req.body.key = 'abc'
    await flipPromise(combineToAsync(
      transformer('key').toInt({max: 0}),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction))
    expect(req.body.key).toBe('abc')

    ;(transformationResult(req as Request) as Array<any>).splice(0, 1)
    delete req.body.key
    await flipPromise(combineToAsync(
      transformer('key').toInt({force: true}),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction))
    expect(req.body.key).toBe(undefined)
  })
})
