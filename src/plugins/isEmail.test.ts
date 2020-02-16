/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {NextFunction, Request, Response} from 'express'
import transformer, {transformationResult} from '../transformer'
import {validateTransformation} from '../testHelper'
import flipPromise from 'flip-promise'

describe('Transform', () => {
	test('isIn', async () => {
		const req = {body: {key: 'info@transang.me'}}
		await combineToAsync(
			transformer('key').isEmail(),
			validateTransformation
		)(req as Request, undefined as unknown as Response)

		;(transformationResult(req as Request) as Array<any>).splice(0, 1)
		req.body.key = '1'
		await flipPromise(combineToAsync(
			transformer('key').isEmail(),
			validateTransformation
		)(req as Request, undefined as unknown as Response))

		;(transformationResult(req as Request) as Array<any>).splice(0, 1)
	})
})
