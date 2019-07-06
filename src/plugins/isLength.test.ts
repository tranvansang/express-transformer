/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {NextFunction, Request, Response} from 'express'
import transformer, {transformationResult} from '../transformer'
import {validateTransformation} from '../../test/helper'
import flipPromise from 'flip-promise'

describe('Transform', () => {
  test('isLength', async () => {
    const req: {body: {key: string | number | number[]}} = {body: {key: ''}}
    req.body.key = '4538136094603680'

    for (const key of [
      '123456',
      123,
      '',
      [],
      [1, 2, 3, 4, 5, 6]
    ]) {
      transformationResult(req as Request).splice(0, 1)
      req.body.key = key
      await flipPromise(combineToAsync(
        transformer('key').isLength({min: 1, max: 5}),
        validateTransformation
      )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction))
    }

    for (const key of [
      '123',
      [1, 2, 3],
    ]) {
      transformationResult(req as Request).splice(0, 1)
      req.body.key = key
      await combineToAsync(
        transformer('key').isLength({min: 1, max: 5}),
        validateTransformation
      )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
    }

    for (const length of [3, '3'])
      for (const key of ['123456',
        '12',
        [],
        [1, 2, 3, 4, 5, 6]
      ]) {
        transformationResult(req as Request).splice(0, 1)
        req.body.key = key
        await flipPromise(combineToAsync(
          transformer('key').isLength(length),
          validateTransformation
        )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction))
      }
    for (const length of [3, '3'])
      for (const key of [
        '123',
        [1, 2, 3],
      ]) {
        transformationResult(req as Request).splice(0, 1)
        req.body.key = key
        await combineToAsync(
          transformer('key').isLength(length),
          validateTransformation
        )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
      }

    //empty val
    transformationResult(req as Request).splice(0, 1)
    delete req.body.key
    await flipPromise(combineToAsync(
      transformer('key').isLength(1, {force: true}),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction))

    transformationResult(req as Request).splice(0, 1)
    delete req.body.key
    await combineToAsync(
      transformer('key').isLength(1, {force: false}),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
  })
})
