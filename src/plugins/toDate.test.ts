/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {Request, Response} from 'express'
import {transformer} from '../transformer'
import flipPromise from 'flip-promise'

describe('Transform Plugins', () => {
	test('to date', async () => {
		const req = {body: {key: '1'}}
		let date = new Date()

		req.body.key = {}
		await flipPromise(combineToAsync(
			transformer('key').toDate(),
		)(req as Request, undefined as unknown as Response))

		req.body.key = date.toISOString()
		await combineToAsync(
			transformer('key').toDate(),
		)(req as Request, undefined as unknown as Response)
		expect(req.body.key).toEqual(date)

		req.body.key = date.getTime()
		await combineToAsync(
			transformer('key').toDate(),
		)(req as Request, undefined as unknown as Response)
		expect(req.body.key).toEqual(date)

		date = new Date()
		req.body.key = date.toISOString()
		await combineToAsync(
			transformer('key').toDate({resetTime: true}),
		)(req as Request, undefined as unknown as Response)
		date.setMinutes(0)
		date.setHours(0)
		date.setMilliseconds(0)
		date.setSeconds(0)
		expect(req.body.key).toEqual(date)

		date = new Date()
		req.body.key = date
		await combineToAsync(
			transformer('key').toDate({resetTime: true}),
		)(req as Request, undefined as unknown as Response)
		date.setMinutes(0)
		date.setHours(0)
		date.setMilliseconds(0)
		date.setSeconds(0)
		expect(req.body.key).toEqual(date)

		req.body.key = 'a'
		await flipPromise(combineToAsync(
			transformer('key').toDate({resetTime: true}),
		)(req as Request, undefined as unknown as Response))

		delete req.body.key
		await flipPromise(combineToAsync(
			transformer('key').toDate({resetTime: true, force: true}),
		)(req as Request, undefined as unknown as Response))
	})
})
