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

		req.body.key = 1n
		await combineToAsync(
			transformer('key').toDate(),
		)(req as Request, undefined as unknown as Response)

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

		req.body.key = new Date('a')
		await flipPromise(combineToAsync(
			transformer('key').toDate(),
		)(req as Request, undefined as unknown as Response))

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
		expect(req.body.key).toBe(date)
		expect(date.getMilliseconds()).toBe(0)
		expect(date.getMinutes()).toBe(0)
		expect(date.getHours()).toBe(0)
		expect(date.getSeconds()).toBe(0)

		//no coypy
		date = new Date()
		req.body.key = date
		await combineToAsync(
			transformer('key').toDate({resetTime: true, copy: true}),
		)(req as Request, undefined as unknown as Response)
		expect(req.body.key).not.toBe(date)
		date.setHours(0)
		date.setMinutes(0)
		date.setSeconds(0)
		date.setMilliseconds(0)
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

	test('to date option', async () => {
		const now = Date.now()
		for (const [option] of [
			[{before: now - 1}],
			[{before: now}],
			[{after: now + 1}],
			[{after: now}],
			[{notBefore: now + 1}],
			[{notBefore: now + 2}],
			[{notAfter: now - 1}],
			[{notAfter: now - 2}],
		]) {
			const req = {body: {key: new Date(now)}}
			await flipPromise(combineToAsync(
				transformer('key').toDate(option),
			)(req as Request, undefined as unknown as Response))
		}
		for (const [option] of [
			[{before: now + 1}],
			[{before: now + 2}],
			[{after: now - 1}],
			[{after: now - 2}],
			[{notBefore: now}],
			[{notBefore: now - 1}],
			[{notAfter: now}],
			[{notAfter: now + 1}],
			[{before: new Date(now + 1)}],
			[{before: new Date(now + 1).toISOString()}],
			[{before: BigInt(now + 1)}],
		]) {
			const req = {body: {key: new Date(now)}}
			await combineToAsync(
				transformer('key').toDate(option),
			)(req as Request, undefined as unknown as Response)
		}

		await flipPromise((async () => transformer('key').toDate({before: 'a'}))())
		await flipPromise((async () => transformer('key').toDate({before: {}}))())
		await flipPromise((async () => transformer('key').toDate({before: new Date('a')}))())
	})
})
