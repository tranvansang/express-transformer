/* eslint-disable import/no-extraneous-dependencies */
import flipPromise from 'flip-promise'
import {combineToAsync} from 'middleware-async'
import {Request, Response} from 'express'
import {transformer} from '../transformer'
import TransformationError, {transformationErrorName} from '../TransformationError'

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
		const error = await flipPromise(combineToAsync(
			transformer('key').transform(() => Promise.reject(1), {force: true}).message('hi'),
		)({} as Request, undefined as unknown as Response))
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
				.message('hi', {global: true}),
		)({body: {}} as Request, undefined as unknown as Response)) as TransformationError
		expect(err.message).toBe('hi')
		expect(err.name).toBe(transformationErrorName)
	})

	test('print warning when specify two messages', async () => {
		console.warn = jest.fn()
		await combineToAsync(
			transformer(['k1[].a1[].a2', 'k2[]', 'k3.c3[]'])
				.message('1')
				.transform(jest.fn())
				.message('1')
				.message('1'),
		)(req as Request, undefined as unknown as Response)
		expect(console.warn.mock.calls.length).toBe(1)

		console.warn.mockClear()
		await combineToAsync(
			transformer(['k1[].a1[].a2', 'k2[]', 'k3.c3[]'])
				.message('1')
				.transform(jest.fn())
				.message('1')
				.message('1', {disableOverwriteWarning: true}),
		)(req as Request, undefined as unknown as Response)
		expect(console.warn.mock.calls.length).toBe(0)

		console.warn.mockClear()
		await combineToAsync(
			transformer(['k1[].a1[].a2', 'k2[]', 'k3.c3[]'])
				.message('1')
				.message('1')
		)(req as Request, undefined as unknown as Response)
		expect(console.warn.mock.calls.length).toBe(0)

		req.body.a = 1
		console.warn.mockClear()
		await combineToAsync(
			transformer('a')
				.use([
					['transform', jest.fn()],
					['message', '1'],
					['message', '1']
				])
		)(req as Request, undefined as unknown as Response)
		expect(console.warn.mock.calls.length).toBe(1)
	})
})
