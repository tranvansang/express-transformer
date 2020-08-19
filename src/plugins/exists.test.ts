/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {Request, Response} from 'express'
import {transformer} from '../transformer'
import flipPromise from 'flip-promise'

describe('Transform', () => {
	test('should check exist', async () => {
		await flipPromise(combineToAsync(
			transformer('key').exists(),
		)({} as Request, undefined as unknown as Response))
		for (const val of [undefined, null, '']) {
			await flipPromise(combineToAsync(
				transformer('key').exists(),
			)({body: {key: val}} as Request, undefined as unknown as Response))
		}
		for (const val of [0, false, true, 1, 'hii'])
			await combineToAsync(
				transformer('key').exists(),
			)
		await combineToAsync(
			transformer('key').exists({acceptEmptyString: true}),
		)({body: {key: ''}} as Request, undefined as unknown as Response)
	})
})
