/* eslint-disable import/no-extraneous-dependencies */
import {NextFunction, Request, Response} from 'express'
import {combineToAsync} from 'middleware-async'
import transformer from '../transformer'
import {validateTransformation} from '../../test/helper'

describe('Transform', () => {
  test('should set default', async () => {
    const req = {body: {key: 'foo', key2: null, key3: ''}}
    await combineToAsync(
      transformer('key1').defaultValue('bar'),
      transformer('key').defaultValue('bar'),
      transformer('key2').defaultValue('bar'),
      transformer('key3').defaultValue('bar'),
      validateTransformation
    )(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
    expect(req).toEqual({
      body: {
        key: 'foo',
        key1: 'bar',
        key2: 'bar',
        key3: 'bar'
      }
    })
  })
})
