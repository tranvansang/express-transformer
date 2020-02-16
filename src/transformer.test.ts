/* eslint-disable import/no-extraneous-dependencies */
import flipPromise from 'flip-promise'
import {combineToAsync} from 'middleware-async'
import {validateTransformation} from './testHelper'
import transformer, {transformationResult} from './transformer'
import TransformationError, {transformationErrorName} from './TransformationError'
import {NextFunction, Request, Response} from 'express'

describe('Transform', () => {
	let req: Request
	beforeEach(() => {
		req = {body: {}} as Request
	})

	test('should check message', async () => {
		const err = await flipPromise(combineToAsync(
			transformer('key').message(() => 'hi').exists(),
			validateTransformation
		)({} as Request, undefined as unknown as Response)) as TransformationError
		expect(err.message).toBe('hi')
		expect(err.name).toBe(transformationErrorName)
	})

	test('should accept constant message string', async () => {
		const err = await flipPromise(combineToAsync(
			transformer('key').message('hi').exists(),
			validateTransformation
		)({} as Request, undefined as unknown as Response)) as TransformationError
		expect(err.message).toBe('hi')
		expect(err.name).toBe(transformationErrorName)
	})

	test('should accept ignore message and get TransformationError', async () => {
		const err = new TransformationError('an error')
		const error = await flipPromise(combineToAsync(
			transformer('key').message('hi').transform(() => Promise.reject(err), {force: true}),
			validateTransformation
		)({} as Request, undefined as unknown as Response)) as TransformationError
		expect(error.message).toBe('hi')
		expect(error.name).toBe(transformationErrorName)
	})

	test('should accept take message and ignore uncontrolled error in transformer', async () => {
		const err = await flipPromise(combineToAsync(
			transformer('key').message('hi').transform(() => Promise.reject(new Error('hello')), {force: true}),
			validateTransformation
		)({} as Request, undefined as unknown as Response)) as TransformationError
		expect(err.message).toBe('hi')
		expect(err.name).toBe(transformationErrorName)
	})

	test('should invalidate value if message callback throws error', async () => {
		await flipPromise(combineToAsync(
			transformer('key').message(() => Promise.reject(1)),
			validateTransformation
		)({body: {key: 'hi'}} as Request, undefined as unknown as Response))
	})

	test('should ignore custom message from second transformer', async () => {
		const err = await flipPromise(combineToAsync(
			transformer('key')
				.message('hi')
				.transform(val => val)
				.exists(),
			validateTransformation
		)({body: {}} as Request, undefined as unknown as Response)) as TransformationError
		expect(err.message).toBe('key is required')
		expect(err.name).toBe(transformationErrorName)
	})

	test('should use custom forced message from second transformer', async () => {
		const err = await flipPromise(combineToAsync(
			transformer('key')
				.message('hi', {force: true})
				.transform(val => val)
				.exists()
			,
			validateTransformation
		)({body: {}} as Request, undefined as unknown as Response)) as TransformationError
		expect(err.message).toBe('hi')
		expect(err.name).toBe(transformationErrorName)
	})

	test('should check other', async () => {
		//custom
		(transformationResult(req as Request) as Array<any>).splice(0, 1)
		req.body.key = 1
		const inc = (x: number): Promise<number> => new Promise(resolve => setTimeout(() => resolve(x + 1), 1))
		await combineToAsync(
			transformer<number, number>('key')
				.transform(async val => await inc(val))
				.transform(inc),
			validateTransformation
		)(req, undefined as unknown as Response)
		expect(req.body.key).toBe(3)
	})

	test('should stop in the first err', async () => {
		(transformationResult(req as Request) as Array<any>).splice(0, 1)
		req.body.key = 1
		await flipPromise(combineToAsync(
			transformer('key')
				.transform(async () => Promise.reject(1)),
			transformer<number, number>('key')
				.transform(val => val + 2),
			validateTransformation
		)(req as Request, undefined as unknown as Response))
		expect(req.body.key).toBe(1)
	})

	test('should work on array', async () => {
		(transformationResult(req as Request) as Array<any>).splice(0, 1)
		req.body.key1 = 1
		req.body.key2 = 2
		await combineToAsync(
			transformer<[number, number], [number, number]>(['key1', 'key2'])
				.transform(([key1, key2]) => [key1 + key2, key2]),
			validateTransformation
		)(req as Request, undefined as unknown as Response)
		expect(req.body.key1).toBe(3)
		expect(req.body.key2).toBe(2)

		;(transformationResult(req as Request) as Array<any>).splice(0, 1)
		delete req.body.key1
		delete req.body.key2
		const check = jest.fn()
		await combineToAsync(
			transformer(['key1', 'key2'])
				.transform(check, {force: true}),
			validateTransformation
		)(req as Request, undefined as unknown as Response)
		expect(check.mock.calls).toEqual([[[undefined, undefined], expect.anything()]])

		;(transformationResult(req as Request) as Array<any>).splice(0, 1)
		delete req.body.key1
		delete req.body.key2
		const check1 = jest.fn()
		await combineToAsync(
			transformer(['key1', 'key2'])
				.transform(check1),
			validateTransformation
		)(req as Request, undefined as unknown as Response)
		expect(check1.mock.calls.length).toBe(0)
	})

	test('should validate array', async () => {
		(transformationResult(req as Request) as Array<any>).splice(0, 1)
		delete req.body.key1
		req.body.key2 = '1'
		let check = jest.fn()
		await combineToAsync(
			transformer(['key2', 'key1'])
				.each(check),
			validateTransformation
		)(req as Request, undefined as unknown as Response)
		expect(check.mock.calls).toEqual([['1', expect.anything()]])

		;(transformationResult(req as Request) as Array<any>).splice(0, 1)
		delete req.body.key1
		req.body.key2 = '1'
		check = jest.fn()
		await combineToAsync(
			transformer(['key2', 'key1'])
				.each(check, {force: true}),
			validateTransformation
		)(req as Request, undefined as unknown as Response)
		expect(check.mock.calls.length).toBe(2)

		;(transformationResult(req as Request) as Array<any>).splice(0, 1)
		delete req.body.key1
		req.body.key2 = '1'
		await flipPromise(combineToAsync(
			transformer(['key2', 'key1'])
				.exists(),
			validateTransformation
		)(req as Request, undefined as unknown as Response))

		;(transformationResult(req as Request) as Array<any>).splice(0, 1)
		delete req.body.key1
		req.body.key2 = 1
		req.body.key1 = 3
		await combineToAsync(
			transformer<number, number>(['key2', 'key1'])
				.each((val: number) => val + 1),
			validateTransformation
		)(req as Request, undefined as unknown as Response)
		expect(req.body.key2).toBe(2)
		expect(req.body.key1).toBe(4)
	})

	test('should reject something dirty', async () => {
		req.__transformationErrors = Object.create(null)
		await flipPromise(combineToAsync(
			transformer('key').exists(),
			validateTransformation
		)(undefined as unknown as Request, undefined as unknown as Response))
	})
})
