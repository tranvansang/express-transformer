/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {NextFunction, Request, Response} from 'express'
import transformer, {transformationResult} from '../transformer'
import {validateTransformation} from '../../test/helper'
import flipPromise from 'flip-promise'

describe('Transform', () => {
  test('isIn', async () => {
    const req = {body: {key: ''}}
    req.body.key = '123abcd'
    await combineToAsync(
      transformer('key').matches(/abc/),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)

    ;(transformationResult(req as Request) as Array<any>).splice(0, 1)
    req.body.key = 'a123'
    await flipPromise(combineToAsync(
      transformer('key').matches(/^\d*$/),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction))

    ;(transformationResult(req as Request) as Array<any>).splice(0, 1)
    delete req.body.key
    await flipPromise(combineToAsync(
      transformer('key').matches(/^\d*$/, {force: true}),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction))
  })
})
