/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {transformer} from '../transformer'
import {Request, Response} from 'express'

describe('Transform', () => {
	test('should trim', async () => {
		const req = {body: {key: ' 12	'}}
		await combineToAsync(
			transformer('key').trim(),
		)(req as Request, undefined as unknown as Response)
		expect(req.body.key).toBe('12')
	})
	test('should not trim', async () => {
		const req = {body: {key: 123}}
		await combineToAsync(
			transformer('key').trim(),
		)(req as Request, undefined as unknown as Response)
		expect(req.body.key).toBe(123)
	})
})

