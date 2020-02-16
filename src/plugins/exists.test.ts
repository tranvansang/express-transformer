/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {NextFunction, Request, Response} from 'express'
import transformer from '../transformer'
import {validateTransformation} from '../testHelper'
import flipPromise from 'flip-promise'

describe('Transform', () => {
	test('should check exist', async () => {
		await flipPromise(combineToAsync(
			transformer('key').exists(),
			validateTransformation
		)({} as Request, undefined as unknown as Response, undefined as unknown as NextFunction))
		for (const val of [undefined, null, '']) {
			await flipPromise(combineToAsync(
				transformer('key').exists(),
				validateTransformation
			)({body: {key: val}} as Request, undefined as unknown as Response, undefined as unknown as NextFunction))
		}
		for (const val of [0, false, true, 1, 'hii'])
			await combineToAsync(
				transformer('key').exists(),
				validateTransformation
			)({body: {key: val}} as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
		await combineToAsync(
			transformer('key').exists({acceptEmptyString: true}),
			validateTransformation
		)({body: {key: ''}} as Request, undefined as unknown as Response, undefined as unknown as NextFunction)
	})
})
