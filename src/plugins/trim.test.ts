/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import transformer, {transformationResult} from '../transformer'
import {validateTransformation} from '../testHelper'
import {NextFunction, Request, Response} from 'express'

describe('Transform', () => {
	test('should trim', async () => {
		const req = {body: {key: ' 12	'}}
		await combineToAsync(
			transformer('key').trim(),
			validateTransformation
		)(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
		expect(req.body.key).toBe('12')
		;(transformationResult(req as Request) as Array<any>).splice(0, 1)
	})
	test('should not trim', async () => {
		const req = {body: {key: 123}}
		await combineToAsync(
			transformer('key').trim(),
			validateTransformation
		)(req as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
		expect(req.body.key).toBe(123)
	})
})

