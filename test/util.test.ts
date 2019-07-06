/* eslint-disable import/no-extraneous-dependencies */
import {recursiveDefault, recursiveGet, recursiveHas, recursiveSet} from '../src/util'

describe('Recursive get', () => {
  test('should get correct value', () => {
    expect(recursiveGet({foo: 'bar'}, 'foo')).toBe('bar')
    expect(recursiveGet({foo: 'bar'}, 'bar', 'foo')).toBe('foo')
    expect(recursiveGet({
      foo: {
        fooo: 'baar'
      }
    }, 'foo.fooo')).toBe('baar')
    expect(recursiveGet(null, 'foo.fooo', 1)).toBe(1)
    expect(recursiveGet({foo: 0}, 'foo')).toBe(0)
    expect(recursiveGet({foo: undefined}, 'foo')).toBeUndefined()
    expect(recursiveGet({foo: undefined}, 'foo.bar')).toBeUndefined()
    expect(recursiveGet({foo: 0}, 'foo.bar')).toBeUndefined()
    expect(recursiveGet([1, 2, 3], '1')).toBe(2)
    expect(recursiveGet({foo: [1, {bar: 2}, 3]}, 'foo.1.bar')).toBe(2)
  })
})

describe('Recursive set', () => {
  test('should set correct value', () => {
    const obj: {d: {e: string}, a?: {b?: string}, f?: {1?: string}} = {d: {e: 'f'}}
    recursiveSet(obj, 'a.b', 'c')
    expect(obj.a!.b).toBe('c')
    recursiveSet(obj, 'd.e', 'g')
    expect(obj.d.e).toBe('g')
    recursiveSet(obj, 'f.1', 'h')
    expect(obj.f).toEqual({1: 'h'})
    let obj1
    recursiveSet(obj1, 'd.e', 'g')
    recursiveSet(1, 'd.e', 'g')
    obj1 = {foo: [1]}
    recursiveSet(obj1, 'foo.1', 2)
    expect(obj1.foo).toEqual([1, 2])
  })
})

describe('Recursive has', () => {
  test('should check correctly', () => {
    expect(recursiveHas({a: {b: false}}, 'a.b')).toBe(true)
    expect(recursiveHas({a: {b: undefined}}, 'a.b')).toBe(true)
    expect(recursiveHas({a: {b: undefined}}, 'a.b.c')).toBe(false)
    expect(recursiveHas({a: {b: null}}, 'a.b.c')).toBe(false)
    expect(recursiveHas({a: {b: false}}, 'a.b')).toBe(true)
    expect(recursiveHas({a: {b: null}}, 'a.b')).toBe(true)
    expect(recursiveHas({a: {}}, 'a.b')).toBe(false)
    expect(recursiveHas({}, 'a.b')).toBe(false)
    expect(recursiveHas({a: [1, 2, 3]}, 'a.2')).toBe(true)
    expect(recursiveHas({a: [1, 2, 3]}, 'a.4')).toBe(false)
    let x
    expect(recursiveHas(x, 'a.b')).toBe(false)
  })
})

describe('Recursive default', () => {
  test('should check correctly', () => {
    const obj = {a: {b: 'c'}}
    recursiveDefault(obj, 'a.b', 'd')
    expect(obj).toEqual({a: {b: 'c'}})
    recursiveDefault(obj, 'a.a1.a2', 3)
    expect(obj).toEqual({
      a: {
        b: 'c',
        a1: {
          a2: 3
        }
      }
    })
  })
})
