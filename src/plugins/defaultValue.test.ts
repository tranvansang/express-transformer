/* eslint-disable import/no-extraneous-dependencies */
import {Request, Response} from 'express'
import {combineToAsync} from 'middleware-async'
import {transformer} from '../transformer'

describe('Transform Plugins', () => {
	test('should set default', async () => {
		const req = {body: {key: 'foo', key2: null, key3: ''}}
		await combineToAsync(
			transformer('key1').defaultValue('bar'),
			transformer('key').defaultValue('bar'),
			transformer('key2').defaultValue('bar'),
			transformer('key3').defaultValue('bar'),
		)(req as Request, undefined as unknown as Response)
		expect(req).toEqual({
			body: {
				key: 'foo',
				key1: 'bar',
				key2: 'bar',
				key3: 'bar'
			}
		})
	})
})
