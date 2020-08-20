/* eslint-disable import/no-extraneous-dependencies */
import {Request, Response} from 'express'
import {combineToAsync} from 'middleware-async'
import {transformer} from '../transformer'
import flipPromise from 'flip-promise'

describe('Transform Plugin', () => {
	test('is plugin', async () => {
		const req = {body: {}}
		await combineToAsync(
			transformer('key1').is('bar'),
		)(req as Request, undefined as unknown as Response)
		await flipPromise(combineToAsync(
			transformer('key1').is('bar', {force: true}),
		)(req as Request, undefined as unknown as Response))
		req.body.key1 = 'a'
		await flipPromise(combineToAsync(
			transformer('key1').is('bar'),
		)(req as Request, undefined as unknown as Response))
		req.body.key1 = 'bar'
		await combineToAsync(
			transformer('key1').is('bar'),
		)(req as Request, undefined as unknown as Response)
	})
})
