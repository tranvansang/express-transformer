/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {Request, Response} from 'express'
import {transformer} from '../transformer'
import flipPromise from 'flip-promise'

describe('Transform', () => {
	test('isIn', async () => {
		const req = {body: {key: '1'}}
		await combineToAsync(
			transformer('key').isIn(['1', '3']),
		)(req as Request, undefined as unknown as Response)

		req.body.key = '2'
		await flipPromise(combineToAsync(
			transformer('key').isIn(['1', '3']),
		)(req as Request, undefined as unknown as Response))

		delete req.body.key
		await flipPromise(combineToAsync(
			transformer('key').isIn(['1', '3'], {force: true}),
		)(req as Request, undefined as unknown as Response))

		delete req.body.key
		await combineToAsync(
			transformer('key').isIn(['1', '3', undefined], {force: true}),
		)(req as Request, undefined as unknown as Response)
	})
})
