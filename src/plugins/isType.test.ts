/* eslint-disable import/no-extraneous-dependencies */
import {Request, Response} from 'express'
import {combineToAsync} from 'middleware-async'
import {transformer} from '../transformer'
import flipPromise from 'flip-promise'

describe('Transform Plugin', () => {
	test('isType plugin', async () => {
		const req = {body: {}}
		for (const [type, val] of [
			['string', '1'],
			['number', 1],
			['boolean', false],
			['function', () => {}],
			['bigint', 1n],
			['object', null],
			['object', {}],
			['undefined', undefined],
			['symbol', Symbol('foo')],
		] as const) {
			req.body.key = val
			await combineToAsync(
				transformer('key').isType(type, {force: true}),
			)(req as Request, undefined as unknown as Response)
		}
		for (const [type, val] of [
			['string', null],
			['number', null],
			['boolean', null],
			['function', null],
			['bigint', null],
			['object', 1],
			['object', 1],
			['undefined', null],
			['symbol', null],
		] as const) {
			req.body.key = val
			await flipPromise(combineToAsync(
				transformer('key').isType(type, {force: true}),
			)(req as Request, undefined as unknown as Response))
		}
		//the following is for type checking
		transformer('key')
			.isType('string')
			.transform(
				(k: string) => k.startsWith('a'),
				{validateOnly: true}
			)
	})
})
