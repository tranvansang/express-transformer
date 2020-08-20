/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {Request, Response} from 'express'
import {transformer} from '../transformer'
import flipPromise from 'flip-promise'

describe('Transform Plugins', () => {
	test('isLength', async () => {
		const req: {body: {key: string | number | number[]}} = {body: {key: ''}}
		req.body.key = '4538136094603680'

		for (const key of [
			'123456',
			123,
			'',
			[],
			[1, 2, 3, 4, 5, 6]
		]) {
			req.body.key = key
			await flipPromise(combineToAsync(
				transformer('key').isLength({min: 1, max: 5}),
			)(req as Request, undefined as unknown as Response))
		}

		for (const key of [
			'123',
			[1, 2, 3],
		]) {
			req.body.key = key
			await combineToAsync(
				transformer('key').isLength({min: 1, max: 5}),
			)(req as Request, undefined as unknown as Response)
		}

		for (const length of [3, '3'])
			for (const key of ['123456',
				'12',
				[],
				[1, 2, 3, 4, 5, 6]
			]) {
				req.body.key = key
				await flipPromise(combineToAsync(
					transformer('key').isLength(length),
				)(req as Request, undefined as unknown as Response))
			}
		for (const length of [3, '3'])
			for (const key of [
				'123',
				[1, 2, 3],
			]) {
				req.body.key = key
				await combineToAsync(
					transformer('key').isLength(length),
				)(req as Request, undefined as unknown as Response)
			}

		//empty val
		delete req.body.key
		await flipPromise(combineToAsync(
			transformer('key').isLength(1, {force: true}),
		)(req as Request, undefined as unknown as Response))

		delete req.body.key
		await combineToAsync(
			transformer('key').isLength(1, {force: false}),
		)(req as Request, undefined as unknown as Response)

		req.body.key = '3'
		await combineToAsync(
			transformer('key').isLength('{}'),
		)(req as Request, undefined as unknown as Response)
	})
})
