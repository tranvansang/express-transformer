/* eslint-disable import/no-extraneous-dependencies */
import {combineToAsync} from 'middleware-async'
import {transformer} from './transformer'
import flipPromise from 'flip-promise'
import {Request, Response} from 'express'

describe('Transformer library', () => {
	test('should break if transformer throws error', async () => {
		await flipPromise(combineToAsync(
			transformer('any').transform(() => {
				throw new Error('hi')
			}),
		)({body: {any: undefined}} as Request, undefined as unknown as Response))
	})

	test('should transform value', async () => {
		const req = {body: {key: 1}}
		await combineToAsync(
			transformer<number, number>('key').transform(key => key + 1),
		)(req as Request, undefined as unknown as Response)
		expect(req.body.key).toBe(2)
	})

	test('should look at correct location', async () => {
		const check = jest.fn()
		await combineToAsync(
			transformer('key', {location: 'params'}).transform(val => {
				check(val)
				return val
			}),
		)({body: {key: 1}, params: {key: 2}} as Request, undefined as unknown as Response)
		expect(check.mock.calls).toEqual([[2]])
	})

	test('should look at correct multilevel location', async () => {
		const check = jest.fn()
		await combineToAsync(
			transformer('deeper.level', {location: 'body.foo.bar'}).transform(val => {
				check(val)
				return val
			}),
		)({
			body: {
				deeper: {
					level: 1
				},
				foo: {
					bar: {
						deeper: {
							level: 2
						}
					}
				}
			}
		} as Request, undefined as unknown as Response)
		expect(check.mock.calls).toEqual([[2]])
	})

	test('should chain transformer', async () => {
		const req = {body: {key: 1}}
		await combineToAsync(
			transformer<number, number>('key')
				.transform(key => key + 1)
				.transform(key => key + 1),
		)(req as Request, undefined as unknown as Response)
		expect(req.body.key).toBe(3)
	})

	test('should not go next if error', async () => {
		const check = jest.fn()
		const req = {body: {key: 1}}
		await flipPromise(combineToAsync(
			transformer<number, number>('key')
				.transform(() => {
					throw new Error('err')
				})
				.transform(key => {
					check()
					return key + 1
				}),
		)(req as Request, undefined as unknown as Response))
		expect(req.body.key).toBe(1)
		expect(check.mock.calls.length).toBe(0)
	})

	test('should ignore value if not provided', async () => {
		const check = jest.fn()
		await combineToAsync(
			transformer('key').transform(() => check()),
		)({} as Request, undefined as unknown as Response)
		expect(check.mock.calls.length).toBe(0)
	})

	test('should not ignore value if forced', async () => {
		const check = jest.fn()
		await combineToAsync(
			transformer('key').transform(() => check(), {force: true}),
		)({} as Request, undefined as unknown as Response)
		expect(check.mock.calls.length).toBe(1)
	})

	test('should not ignore falsy', async () => {
		for (const val of [undefined, null, '', 0]) {
			const check = jest.fn()
			await combineToAsync(
				transformer('key').transform(() => check()),
			)({body: {key: val}} as Request, undefined as unknown as Response)
			expect(check.mock.calls.length).toBe(1)
		}
	})

	test('should pass correct param to callback', async () => {
		const check = jest.fn()
		const req = {body: {key: 1}}
		await combineToAsync(
			transformer('key').transform(check),
		)(req as Request, undefined as unknown as Response)
		expect(check.mock.calls).toEqual([[1, {
			options: {location: 'body'},
			path: 'key',
			req
		}]])
	})
	test('should pass additional param to callback', async () => {
		const check = jest.fn()
		const req = {body: {key: 1}}
		await combineToAsync(
			transformer('key', {foo: 'bar'}).transform(check),
		)(req as Request, undefined as unknown as Response)
		expect(check.mock.calls).toEqual([[1, {
			options: {location: 'body', foo: 'bar'},
			path: 'key',
			req
		}]])
	})

	test('should not call message on non-provided value', async () => {
		const check = jest.fn()
		await combineToAsync(
			transformer('key').message(check),
		)({} as Request, undefined as unknown as Response)
		expect(check.mock.calls.length).toBe(0)
	})

	describe('array handling', () => {
		test('should process array', async () => {
			const check = jest.fn()
			await combineToAsync(
				transformer('key[]').transform(check),
			)({} as Request, undefined as unknown as Response)
			expect(check.mock.calls.length).toBe(0)
		})

		test('should set empty array with force', async () => {
			const check = jest.fn()
			const req: {body?: {key?: ReadonlyArray<any>}} = {}
			await combineToAsync(
				transformer('key[]').transform(check, {force: true}),
			)(req as Request, undefined as unknown as Response)
			expect(check.mock.calls.length).toBe(0)
			expect(req.body!.key).toEqual([])
		})

		test('should set empty array without force', async () => {
			const check = jest.fn()
			const req = {body: {key: {not_an_obj: 123}}}
			await combineToAsync(
				transformer('key[]').transform(check),
			)(req as Request, undefined as unknown as Response)
			expect(check.mock.calls.length).toBe(0)
			expect(req.body.key).toEqual([])
		})
		test('should process with array last', async () => {
			const req = {body: {key: [1]}}
			await combineToAsync(
				transformer<number, number>('key[]').transform(x => x + 1),
			)(req as Request, undefined as unknown as Response)
			expect(req.body.key[0]).toBe(2)
		})

		test('should process transformer', async () => {
			const req = {
				body: {
					long: {
						path: {
							around: {
								arrayWrapper: [
									{
										long: {
											path: {
												around: {
													myArray: [
														{
															key1: 1,
															key2: 2
														},
														{
															key1: 3,
															key2: 4
														}
													]
												}
											}
										}
									}
								]
							}
						}
					}
				}
			}
			await combineToAsync(
				transformer<number, number>('long.path.around.arrayWrapper[].long.path.around.myArray[].key1')
					.transform(x => x + 1),
				transformer<number, number>('long.path.around.arrayWrapper[].long.path.around.myArray[].key2')
					.transform(x => x * 2),
			)(req as Request, undefined as unknown as Response)
			expect(req).toEqual({
				body: {
					long: {
						path: {
							around: {
								arrayWrapper: [
									{
										long: {
											path: {
												around: {
													myArray: [
														{
															key1: 2,
															key2: 4
														},
														{
															key1: 4,
															key2: 8
														}
													]
												}
											}
										}
									}
								]
							}
						}
					}
				}
			})
		})
	})
})
