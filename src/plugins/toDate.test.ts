/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {NextFunction, Request, Response} from 'express'
import transformer, {transformationResult} from '../transformer'
import {validateTransformation} from '../../test/helper'
import flipPromise from 'flip-promise'

describe('Transform', () => {
  test('to date', async () => {
    const req = {body: {key: '1'}}
    let date = new Date()
    req.body.key = date.toISOString()
    await combineToAsync(
      transformer('key').toDate(),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
    expect(req.body.key).toEqual(date)

    transformationResult(req as Request).splice(0, 1)
    date = new Date()
    req.body.key = date.toISOString()
    await combineToAsync(
      transformer('key').toDate({resetTime: true}),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
    date.setMinutes(0)
    date.setHours(0)
    date.setMilliseconds(0)
    date.setSeconds(0)
    expect(req.body.key).toEqual(date)

    transformationResult(req as Request).splice(0, 1)
    delete req.body.key
    await flipPromise(combineToAsync(
      transformer('key').toDate({resetTime: true, force: true}),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction))
  })
})
