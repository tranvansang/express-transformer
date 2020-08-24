/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {Request, Response} from 'express'
import {transformer} from '../transformer'
import flipPromise from 'flip-promise'

describe('Transform Plugins', () => {
	test('should check to int', async () => {
		const req: {body: {key: string | number}} = {body: {key: '1'}}
		for (const [inp, out, opts] of [
			['1', 1],
			[1n, 1],
			[12, 12],
			['12', 12],
			[12.02, 12],
			[1.2, 1],
			[-1.3, -1],
		]) {
			req.body.key = inp
			await combineToAsync(
				transformer('key').toInt(opts),
			)(req as Request, undefined as unknown as Response)
			expect(req.body.key).toBe(out)
		}
		for (const [inp, opts] of [
			['1', {min: 3}],
			['1', {max: 0}],
			['abc', {max: 0}]
		]) {
			req.body.key = inp
			await flipPromise(combineToAsync(
				transformer('key').toInt(opts),
			)(req as Request, undefined as unknown as Response))
			expect(req.body.key).toBe(inp)
		}
		delete req.body.key
		await flipPromise(combineToAsync(
			transformer('key').toInt({force: true}),
		)(req as Request, undefined as unknown as Response))
		expect(req.body.key).toBe(undefined)

		req.body.key = Infinity
		await flipPromise(combineToAsync(
			transformer('key').toFloat(),
		)(req as Request, undefined as unknown as Response))

		await combineToAsync(
			transformer('key').toFloat({acceptInfinity: true}),
		)(req as Request, undefined as unknown as Response)
	})
})
