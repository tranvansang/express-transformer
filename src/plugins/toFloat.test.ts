/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {Request, Response} from 'express'
import {transformer} from '../transformer'
import flipPromise from 'flip-promise'

describe('Transform Plugins', () => {
	test('should check to float', async () => {
		const req: {body: {key?: number | string}} = {body: {key: '1.5'}}
		await combineToAsync(
			transformer('key').toFloat(),
		)(req as Request, undefined as unknown as Response)
		expect(req.body.key).toBe(1.5)

		req.body.key = 12.3
		await combineToAsync(
			transformer('key').toFloat(),
		)(req as Request, undefined as unknown as Response)
		expect(req.body.key).toBe(12.3)

		req.body.key = '1.5'
		await flipPromise(combineToAsync(
			transformer('key').toFloat({min: 3}),
		)(req as Request, undefined as unknown as Response))
		expect(req.body.key).toBe('1.5')

		req.body.key = '1.7'
		await flipPromise(combineToAsync(
			transformer('key').toFloat({max: 0}),
		)(req as Request, undefined as unknown as Response))
		expect(req.body.key).toBe('1.7')

		req.body.key = undefined
		await flipPromise(combineToAsync(
			transformer('key').toFloat({max: 0}),
		)(req as Request, undefined as unknown as Response))
		expect(req.body.key).toBeUndefined()

		req.body.key = 'a123'
		await flipPromise(combineToAsync(
			transformer('key').toFloat({max: 0}),
		)(req as Request, undefined as unknown as Response))
		expect(req.body.key).toBe('a123')

		delete req.body.key
		await combineToAsync(
			transformer('key').toFloat({max: 0}),
		)(req as Request, undefined as unknown as Response)
		expect(req.body.key).toBe(undefined)
	})
})
