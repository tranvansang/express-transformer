/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {Request, Response} from 'express'
import {transformer} from '../transformer'
import flipPromise from 'flip-promise'

describe('Transform Plugins', () => {
	test('matches', async () => {
		const req = {body: {key: ''}}
		req.body.key = '123abcd'
		await combineToAsync(
			transformer('key').matches(/abc/),
		)(req as Request, undefined as unknown as Response)

		req.body.key = 'a123'
		await flipPromise(combineToAsync(
			transformer('key').matches(/^\d*$/),
		)(req as Request, undefined as unknown as Response))

		delete req.body.key
		await flipPromise(combineToAsync(
			transformer('key').matches(/^\d*$/, {force: true}),
		)(req as Request, undefined as unknown as Response))
	})
})
