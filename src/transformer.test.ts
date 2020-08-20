/* eslint-disable import/no-extraneous-dependencies */
import flipPromise from 'flip-promise'
import {combineToAsync} from 'middleware-async'
import {transformer} from './transformer'
import TransformationError, {transformationErrorName} from './TransformationError'
import {Request, Response} from 'express'

describe('Transform Plugins', () => {
	let req: Request
	beforeEach(() => {
		req = {body: {}} as Request
	})

	test('should check message', async () => {
		const err = await flipPromise(combineToAsync(
			transformer('key').exists().message(() => 'hi'),
		)({} as Request, undefined as unknown as Response)) as TransformationError
		expect(err.message).toBe('hi')
		expect(err.name).toBe(transformationErrorName)
	})

	test('should accept constant message string', async () => {
		const err = await flipPromise(combineToAsync(
			transformer('key').exists().message('hi'),
		)({} as Request, undefined as unknown as Response)) as TransformationError
		expect(err.message).toBe('hi')
		expect(err.name).toBe(transformationErrorName)
	})

	test('should accept ignore message and get TransformationError', async () => {
		const err = new TransformationError('an error')
		const error = await flipPromise(combineToAsync(
			transformer('key').transform(() => Promise.reject(err), {force: true}).message('hi'),
		)({} as Request, undefined as unknown as Response)) as TransformationError
		expect(error.message).toBe('hi')
		expect(error.name).toBe(transformationErrorName)
	})

	test('should take message and ignore uncontrolled error in transformer', async () => {
		const err = await flipPromise(combineToAsync(
			transformer('key').transform(() => Promise.reject(new Error('hello')), {force: true}).message('hi'),
		)({} as Request, undefined as unknown as Response)) as TransformationError
		expect(err.message).toBe('hi')
		expect(err.name).toBe(transformationErrorName)
	})

	test('should invalidate value if message callback throws error', async () => {
		expect(await flipPromise(combineToAsync(
			transformer('key')
				.transform(() => Promise.reject(2))
				.message(() => Promise.reject(1)),
		)({body: {key: 'hi'}} as Request, undefined as unknown as Response))).toBe(1)
	})

	test('should ignore custom message from second transformer', async () => {
		const err = await flipPromise(combineToAsync(
			transformer('key')
				.transform(val => val)
				.message('hi')
				.exists(),
		)({body: {}} as Request, undefined as unknown as Response)) as TransformationError
		expect(err.message).toBe('key is required')
		expect(err.name).toBe(transformationErrorName)
	})

	test('should use custom forced message from second transformer', async () => {
		const err = await flipPromise(combineToAsync(
			transformer('key')
				.transform(val => val)
				.exists()
				.message('hi', {force: true}),
		)({body: {}} as Request, undefined as unknown as Response)) as TransformationError
		expect(err.message).toBe('hi')
		expect(err.name).toBe(transformationErrorName)
	})

	test('should check other', async () => {
		//custom
		req.body.key = 1
		const inc = (x: number): Promise<number> => new Promise(resolve => setTimeout(() => resolve(x + 1), 1))
		await combineToAsync(
			transformer<number, number>('key')
				.transform(async val => await inc(val))
				.transform(inc),
		)(req, undefined as unknown as Response)
		expect(req.body.key).toBe(3)
	})

	test('should stop in the first err', async () => {
		req.body.key = 1
		await flipPromise(combineToAsync(
			transformer('key')
				.transform(async () => Promise.reject(1)),
			transformer<number, number>('key')
				.transform(val => val + 2),
		)(req as Request, undefined as unknown as Response))
		expect(req.body.key).toBe(1)
	})

	test('should work on array', async () => {
		req.body.key1 = 1
		req.body.key2 = 2
		await combineToAsync(
			transformer(['key1', 'key2'])
				.transform(([key1, key2]) => [key1 + key2, key2]),
		)(req as Request, undefined as unknown as Response)
		expect(req.body.key1).toBe(3)
		expect(req.body.key2).toBe(2)

		delete req.body.key1
		delete req.body.key2
		const check = jest.fn()
		await combineToAsync(
			transformer(['key1', 'key2'])
				.transform(check, {force: true}),
		)(req as Request, undefined as unknown as Response)
		expect(check.mock.calls).toEqual([[[undefined, undefined], expect.anything()]])

		delete req.body.key1
		delete req.body.key2
		const check1 = jest.fn()
		await combineToAsync(
			transformer(['key1', 'key2'])
				.transform(check1),
		)(req as Request, undefined as unknown as Response)
		expect(check1.mock.calls.length).toBe(0)
	})

	test('should reject something dirty', async () => {
		await flipPromise(combineToAsync(
			transformer('key').exists(),
		)(undefined as unknown as Request, undefined as unknown as Response))
	})

	test('support array of arrays and pass correct list of paths', async () => {
		req.body = {
			k1: [
				{a1: [{a2: 1}]},
			],
			k2: [2, 3],
			k3: {
				c3: [4]
			}
		}
		const check = jest.fn()
		await combineToAsync(
			transformer(['k1[].a1[].a2', 'k2[]', 'k3.c3[]'])
				.transform(check, {force: true, validateOnly: true}),
		)(req as Request, undefined as unknown as Response)
		expect(check.mock.calls).toEqual([
			[[1,2,4], {
				path: ['k1.0.a1.0.a2', 'k2.0', 'k3.c3.0'],
				req,
				options: {location: 'body'}
			}],
			[[1,3,4], {
				path: ['k1.0.a1.0.a2', 'k2.1', 'k3.c3.0'],
				req,
				options: {location: 'body'}
			}]
		])
	})
	test('support array of arrays', async () => {
		req.body = {
			k1: [
				{a1: [{a2: 1}, {a2: 2}, {a2: 3}]},
				{a1: [{a2: 4}, {a2: 5}]}
			],
			k2: [6, 7],
			k3: {
				c3: [8, 9, 10]
			}
		}
		const check = jest.fn()
		await combineToAsync(
			transformer(['k1[].a1[].a2', 'k2[]', 'k3.c3[]'])
				.transform(check, {force: true, validateOnly: true}),
		)(req as Request, undefined as unknown as Response)
		const params = []
		for (const k1 of [1,2,3,4,5])
			for (const k2 of [6, 7])
				for (const k3 of [8, 9, 10])
					params.push([[k1, k2, k3], expect.anything()])
		expect(check.mock.calls).toEqual(params)
	})
})
