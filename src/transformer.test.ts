/* eslint-disable import/no-extraneous-dependencies */
import flipPromise from 'flip-promise'
import {combineToAsync} from 'middleware-async'
import {addTransformerPlugin, transformer} from './transformer'
import {Request, Response} from 'express'

describe('Transform Plugins', () => {
	let req: Request
	beforeEach(() => {
		req = {body: {}} as Request
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
				path: ['k1[0].a1[0].a2', 'k2[0]', 'k3.c3[0]'],
				pathSplits: [
					['k1', 0, 'a1', 0, 'a2'],
					['k2', 0],
					['k3', 'c3', 0]
				],
				req,
				options: {location: 'body'}
			}],
			[[1,3,4], {
				path: ['k1[0].a1[0].a2', 'k2[1]', 'k3.c3[0]'],
				pathSplits: [
					['k1', 0, 'a1', 0, 'a2'],
					['k2', 1],
					['k3', 'c3', 0]
				],
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

describe('transformer plugin', () => {
	test('addTransformerPlugin', async () => {
		addTransformerPlugin({ name: 'newPlugin' })
		await flipPromise((async () => addTransformerPlugin({}))())
	})
})

describe('raw key options', () => {
	test('rawkey and rawLocation', async () => {
		const req: Request = {
			body: {
				a: {b: {c: 1}, 'b.c': 2},
			},
			'body.a': {'b.c': 3, b: {c: 4}},
			'body.a.b.c': 5,
		}
		const fn = jest.fn()
		await combineToAsync(
			transformer('b.c', {location: 'body.a'})
				.transform(fn, {validateOnly: true})
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls[0][0]).toBe(1)

		fn.mockClear()
		await combineToAsync(
			transformer('b.c', {location: 'body.a', rawLocation: true})
				.transform(fn, {validateOnly: true})
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls[0][0]).toBe(4)

		//mix options
		fn.mockClear()
		await combineToAsync(
			transformer('b.c', {location: 'body.a', rawLocation: true, rawPath: true})
				.transform(fn, {validateOnly: true})
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls[0][0]).toBe(3)

		fn.mockClear()
		await combineToAsync(
			transformer('b.c', {location: 'body.a', rawPath: true})
				.transform(fn, {validateOnly: true})
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls[0][0]).toBe(2)
	})
	test('disableArrayNotation', async () => {
		const req: Request = {
			body: {
				b: [{c: 1}, {c: 2}],
				'b[]': {c: 3},
			},
		}
		const fn = jest.fn()
		await combineToAsync(
			transformer('b[].c')
				.transform(fn, {validateOnly: true})
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls).toEqual([[1, expect.anything()], [2, expect.anything()]])

		fn.mockClear()
		await combineToAsync(
			transformer('b[].c', {disableArrayNotation: true})
				.transform(fn, {validateOnly: true})
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls).toEqual([[3, expect.anything()]])

		fn.mockClear()
		req.body.b = [{c: [4]}, {c: [5]}]
		await combineToAsync(
			transformer('b[].c[]')
				.transform(fn, {validateOnly: true})
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls).toEqual([[4, expect.anything()], [5, expect.anything()]])

		fn.mockClear()
		req.body['b[]'] = {'c[]': 6}
		await combineToAsync(
			transformer('b[].c[]', {disableArrayNotation: true})
				.transform(fn, {validateOnly: true})
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls).toEqual([[6, expect.anything()]])
	})

	test('array notation in array of arrays', async () => {
		const req: Request = {
			body: {
				a: [1, 2],
				b: [{c: 3}],
				'a[]': 4,
				'b[]': {c: 5},
				'b[].c': 6
			},
		}
		const fn = jest.fn()
		await combineToAsync(
			transformer(['a[]', 'b[].c'])
				.transform(fn, {validateOnly: true})
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls).toEqual([[[1, 3], expect.anything()], [[2, 3], expect.anything()]])

		fn.mockClear()
		await combineToAsync(
			transformer(['a[]', 'b[].c'], {disableArrayNotation: true})
				.transform(fn, {validateOnly: true})
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls).toEqual([[[4, 5], expect.anything()]])

		fn.mockClear()
		await combineToAsync(
			transformer(['a[]', 'b[].c'], {disableArrayNotation: true, rawPath: true})
				.transform(fn, {validateOnly: true})
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls).toEqual([[[4, 6], expect.anything()]])
	})

	test('array of array iteration with a false force', async () => {
		const req = {
			body: {
				a: 1,
				b: []
			}
		} as Request
		// await combineToAsync(
		// 	transformer(['a[]', 'b[]'])
		// 		.transform(jest.fn(), {validateOnly: true, force: false})
		// )(req, undefined as unknown as Response)
		// expect(req.body).toEqual({a: [], b: []})
		req.body = {a: [], b: 2}
		await combineToAsync(
			transformer(['a[]', 'b[]'])
				.transform(jest.fn(), {validateOnly: true, force: false})
		)(req, undefined as unknown as Response)
		expect(req.body).toEqual({a: [], b: []})
	})

	test('array of array iteration with a true force', async () => {
		const req = {
			body: {
				a: 1,
				b: []
			}
		} as Request
		await combineToAsync(
			transformer(['a[]', 'b[]'])
				.transform(jest.fn(), {validateOnly: true, force: true})
		)(req, undefined as unknown as Response)
		expect(req.body).toEqual({a: [], b: []})
		req.body = {a: [], b: 2}
		await combineToAsync(
			transformer(['a[]', 'b[]'])
				.transform(jest.fn(), {validateOnly: true, force: true})
		)(req, undefined as unknown as Response)
		expect(req.body).toEqual({a: [], b: []})

		req.body = {a: []}
		await combineToAsync(
			transformer(['a[]', 'b[]'])
				.transform(jest.fn(), {validateOnly: true, force: true})
		)(req, undefined as unknown as Response)
		expect(req.body).toEqual({a: [], b: []})
		req.body = {b: []}
		await combineToAsync(
			transformer(['a[]', 'b[]'])
				.transform(jest.fn(), {validateOnly: true, force: true})
		)(req, undefined as unknown as Response)
		expect(req.body).toEqual({a: [], b: []})
	})

	test('incremental test on 3.3.3 where rawPath and disableArrayNotation are used incorrectly', async () => {
		const req = {body: {a: []}} as Request
		await combineToAsync(
			transformer(['a[]', 'b[]'], {rawPath: true})
				.transform(jest.fn(), {validateOnly: true, force: true})
		)(req, undefined as unknown as Response)
		expect(req.body).toEqual({a: [], b: []})
		req.body = {b: []}
		await combineToAsync(
			transformer(['a[]', 'b[]'], {rawPath: true})
				.transform(jest.fn(), {validateOnly: true, force: true})
		)(req, undefined as unknown as Response)
		expect(req.body).toEqual({a: [], b: []})
	})

	test('throw error in array transformer', async () => {
		const req = {
			body: {key: undefined}
		}
		await flipPromise(combineToAsync(
			transformer(['key', 'key2']).transform(() => Promise.reject(1)),
		)(req as Request, undefined as unknown as Response))
	})

	test('force array if one element exists', async () => {
		const req = {
			body: {key: undefined}
		}
		await combineToAsync(
			transformer(['key[].sub', 'key2']).transform(() => Promise.reject(1)),
		)(req as Request, undefined as unknown as Response)

		req.body.key = [{}]
		await combineToAsync(
			transformer(['key[].sub', 'key2']).transform(() => Promise.reject(1)),
		)(req as Request, undefined as unknown as Response)

		req.body.key = [{sub: undefined}]
		await flipPromise(combineToAsync(
			transformer(['key[].sub', 'key2']).transform(() => Promise.reject(1)),
		)(req as Request, undefined as unknown as Response))

		req.body.key = [{sub: undefined}]
		await combineToAsync(
			transformer(['key[].sub[]', 'key2']).transform(() => Promise.reject(1)),
		)(req as Request, undefined as unknown as Response)

		req.body.key = [{sub: []}]
		await combineToAsync(
			transformer(['key[].sub[]', 'key2']).transform(() => Promise.reject(1)),
		)(req as Request, undefined as unknown as Response)

		req.body.key = [{sub: [undefined]}]
		await flipPromise(combineToAsync(
			transformer(['key[].sub[]', 'key2']).transform(() => Promise.reject(1)),
		)(req as Request, undefined as unknown as Response))

		req.body.key = undefined
		req.body.key2 = undefined
		// because there is no value at the key pass. the transformer is never called
		await combineToAsync(
			transformer(['key[].sub[]', 'key2']).transform(() => Promise.reject(1)),
		)(req as Request, undefined as unknown as Response)
	})

	test('force array', async () => {
		const req = {body: {a: 1}}
		await combineToAsync(
			transformer('a[]').transform(() => void 0, {validateOnly: true, force: true}),
		)(req as Request, undefined as unknown as Response)
		expect(req.body.a).toEqual([])

		req.body.products = [{foo: 'bar'}]
		await combineToAsync(
			transformer('products[].config.categories[]').transform(() => void 0, {validateOnly: true, force: true}),
		)(req as Request, undefined as unknown as Response)
		expect(req.body.products).toEqual([{config: {categories: []}, foo: 'bar'}])

		req.body.products = [{foo: 'bar'}]
		await combineToAsync(
			transformer('products[].config.categories[]').transform(() => void 0, {validateOnly: true, force: false}),
		)(req as Request, undefined as unknown as Response)
		expect(req.body.products).toEqual([{foo: 'bar'}])
	})

	test('array with omitted element', async () => {
		const fn = jest.fn()
		const a = []
		a.length = 2
		const req = {body: {a}} as Request
		await combineToAsync(
			transformer('a[]').transform(fn, {force: false}),
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls.length).toBe(0)

		await combineToAsync(
			transformer('a[]').transform(fn, {force: true}),
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls.length).toBe(2)
	})

	test('non chain style', async () => {
		const req = {body: {key: 1}} as Request
		const chain = transformer('key')
		chain.transform(v => v + 1)
		chain.transform(v => v + 2)
		await combineToAsync(chain)(req, undefined as unknown as Response)
		expect(req.body.key).toBe(4)
	})

	test('object traversal fix', async () => {
		for (const val of [null, undefined, 1, '', '2', Symbol('foo'), 3n, false, true]) {
			for (const validateOnly of [true, false]) {
				const req = {body: {key: val}} as Request
				await combineToAsync(
					transformer('key.child')
						.transform(jest.fn(), {force: true, validateOnly})
				)(req, undefined as unknown as Response)
				expect(Object.prototype.hasOwnProperty.call(req.body.key, 'child')).toBe(!validateOnly)
				expect(req).toEqual({body: {key: {}}})
				expect(req).toEqual({body: {key: {child: undefined}}})
				req.body.key.child = 1
			}
		}

		const fn = () => {}
		const req = {body: {key: fn}} as Request
		await combineToAsync(
			transformer('key.child')
				.transform(jest.fn(), {force: false})
		)(req, undefined as unknown as Response)
		expect(req.body.key).toBe(fn)
		expect(Object.prototype.hasOwnProperty.call(req.body.key, 'child')).toBe(false)
		await combineToAsync(
			transformer('key.child')
				.transform(jest.fn(), {force: true})
		)(req, undefined as unknown as Response)
		expect(req.body.key).toBe(fn)
		expect(Object.prototype.hasOwnProperty.call(req.body.key, 'child')).toBe(true)
	})
	test('shape fixing regardless of force', async () => {
		// typeof: 'string', 'number', 'boolean', 'function', 'bigint', 'object'(null), 'undefined', 'symbol'
		for (const key of ['key[]', ['a', 'key[]']])
			for (const val of ['1', '', 1, true, false, () => {}, 1n, null, {}, undefined, Symbol('foo')]) {
				const req = {body: {key: val}} as Request
				await combineToAsync(
					transformer(key)
						.transform(jest.fn(), {force: false, validateOnly: true})
				)(req, undefined as unknown as Response)
				expect(req.body.key).toEqual([])
			}
		for (const key of ['key.foo', ['a', 'key.foo']])
			for (const val of ['1', '', 1, true, false, 1n, null, undefined, Symbol('foo')]) {
				const req = {body: {key: val}} as Request
				await combineToAsync(
					transformer(key)
						.transform(jest.fn(), {force: false, validateOnly: true})
				)(req, undefined as unknown as Response)
				expect(req.body.key).toEqual({})
			}
	})
	test('force on array vs on single element', async () => {
		const req = {body: {a: 1, b: []}} as Request
		req.body.b.length = 2
		const fn = jest.fn()
		await combineToAsync(
			transformer('b[]')
				.transform(fn, {force: false})
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls.length).toEqual(0)
		await combineToAsync(
			transformer('b[]')
				.transform(fn, {force: true})
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls.length).toEqual(2)
		fn.mockClear()
		req.body.b = []
		req.body.b.length = 2
		await combineToAsync(
			transformer(['a', 'b[]'])
				.transform(fn, {force: false})
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls.length).toEqual(2)
	})
	test('zero time of a number is zero', async () => {
		const req = {body: {a: [1, 2, 3], b: []}} as Request
		const fn = jest.fn()
		await combineToAsync(
			transformer(['b[]', 'a[]'])
				.transform(fn, {force: false})
		)(req, undefined as unknown as Response)
		expect(fn.mock.calls.length).toEqual(0)
	})
})
