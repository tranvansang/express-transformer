/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {Request, Response} from 'express'
import {transformer} from '../transformer'
import flipPromise from 'flip-promise'

describe('Transform', () => {
	test('isIn', async () => {
		const req = {body: {key: 'info@transang.me'}}
		await combineToAsync(
			transformer('key').isEmail(),
		)(req as Request, undefined as unknown as Response)

		req.body.key = '1'
		await flipPromise(combineToAsync(
			transformer('key').isEmail(),
		)(req as Request, undefined as unknown as Response))
	})
})
