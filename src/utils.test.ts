/* eslint-disable import/no-extraneous-dependencies */
import {recursiveGet, recursiveHas, recursiveSet} from './utils'

describe('Recursive get', () => {
	test('should get correct value', () => {
		expect(recursiveGet({foo: 'bar'}, 'foo'.split('.'))).toBe('bar')
		expect(recursiveGet({foo: 'bar'}, 'bar'.split('.'), 'foo')).toBe('foo')
		expect(recursiveGet({
			foo: {
				fooo: 'baar'
			}
		}, 'foo.fooo'.split('.'))).toBe('baar')
		expect(recursiveGet(null, 'foo.fooo'.split('.'), 1)).toBe(1)
		expect(recursiveGet({foo: 0}, 'foo'.split('.'))).toBe(0)
		expect(recursiveGet({foo: undefined}, 'foo'.split('.'))).toBeUndefined()
		expect(recursiveGet({foo: undefined}, 'foo.bar'.split('.'))).toBeUndefined()
		expect(recursiveGet({foo: 0}, 'foo.bar'.split('.'))).toBeUndefined()
		expect(recursiveGet([1, 2, 3], '1'.split('.'))).toBe(2)
		expect(recursiveGet({foo: [1, {bar: 2}, 3]}, 'foo.1.bar'.split('.'))).toBe(2)
	})
})

describe('Recursive set', () => {
	test('should set correct value', () => {
		const obj: { d: { e: string }, a?: { b?: string }, f?: { 1?: string } } = {d: {e: 'f'}}
		recursiveSet(obj, 'a.b'.split('.'), 'c')
		expect(obj.a!.b).toBe('c')
		recursiveSet(obj, 'd.e'.split('.'), 'g')
		expect(obj.d.e).toBe('g')
		recursiveSet(obj, 'f.1'.split('.'), 'h')
		expect(obj.f).toEqual({1: 'h'})
		let obj1
		recursiveSet(obj1, 'd.e'.split('.'), 'g')
		recursiveSet(1, 'd.e'.split('.'), 'g')
		obj1 = {foo: [1]}
		recursiveSet(obj1, 'foo.1'.split('.'), 2)
		expect(obj1.foo).toEqual([1, 2])

		obj1 = {key: undefined}
		recursiveSet(obj1, 'key.child'.split('.'), undefined)
		expect(obj1).toEqual({key: {child: undefined}})
		obj1 = {key: null}
		recursiveSet(obj1, 'key.child'.split('.'), undefined)
		expect(obj1).toEqual({key: {child: undefined}})

		obj1 = {key: null}
		recursiveSet(obj1, ['key', 'child', 1], undefined)
		expect(obj1).toEqual({key: {child: [undefined, undefined]}})
		obj1 = {key: {child: [undefined, null]}}
		recursiveSet(obj1, ['key', 'child', 1], undefined)
		expect(obj1).toEqual({key: {child: [undefined, undefined]}})
		obj1 = {key: {child: {1: 'foo'}}}
		recursiveSet(obj1, ['key', 'child', 1], undefined)
		expect(obj1).toEqual({key: {child: [undefined, undefined]}})
	})

	test('optional value parameter', () => {
		const obj1 = {}
		recursiveSet(obj1, 'key.child'.split('.'))
		expect(Object.prototype.hasOwnProperty.call(obj1.key, 'child')).toBe(false)
		expect(obj1).toEqual({key: {child: undefined}})
		expect(obj1).toEqual({key: {}})
		recursiveSet(obj1, 'key.child'.split('.'), undefined)
		expect(Object.prototype.hasOwnProperty.call(obj1.key, 'child')).toBe(true)
		expect(obj1).toEqual({key: {child: undefined}})
		expect(obj1).toEqual({key: {}})
	})
})

describe('Recursive has', () => {
	test('should check correctly', () => {
		expect(recursiveHas({a: {b: false}}, 'a.b'.split('.'))).toBe(true)
		expect(recursiveHas({a: {b: undefined}}, 'a.b'.split('.'))).toBe(true)
		expect(recursiveHas({a: {b: undefined}}, 'a.b.c'.split('.'))).toBe(false)
		expect(recursiveHas({a: {b: null}}, 'a.b.c'.split('.'))).toBe(false)
		expect(recursiveHas({a: {b: false}}, 'a.b'.split('.'))).toBe(true)
		expect(recursiveHas({a: {b: null}}, 'a.b'.split('.'))).toBe(true)
		expect(recursiveHas({a: {}}, 'a.b'.split('.'))).toBe(false)
		expect(recursiveHas({}, 'a.b'.split('.'))).toBe(false)
		expect(recursiveHas({a: [1, 2, 3]}, 'a.2'.split('.'))).toBe(true)
		expect(recursiveHas({a: [1, 2, 3]}, 'a.4'.split('.'))).toBe(false)
		let x
		expect(recursiveHas(x, 'a.b'.split('.'))).toBe(false)
	})
})

