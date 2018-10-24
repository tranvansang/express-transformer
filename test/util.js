/* eslint-disable import/no-extraneous-dependencies */
import chai, {expect} from 'chai'

import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import {
  arrayToObject,
  capitalize,
  isObject,
  isString,
  recursiveDefault,
  recursiveGet,
  recursiveHas,
  recursiveSet,
  reqLogin,
  toDate
} from '../src/util'

chai.use(sinonChai)
chai.use(chaiAsPromised)

describe('Recursive get', () => {
  it('should get correct value', () => {
    expect(recursiveGet({foo: 'bar'}, 'foo')).to.equal('bar')
    expect(recursiveGet({foo: 'bar'}, 'bar', 'foo')).to.equal('foo')
    expect(recursiveGet({
      foo: {
        fooo: 'baar'
      }
    }, 'foo.fooo')).to.equal('baar')
    expect(recursiveGet(null, 'foo.fooo', 1)).to.equal(1)
    expect(recursiveGet({foo: 0}, 'foo')).to.equal(0)
    expect(recursiveGet({foo: undefined}, 'foo')).to.be.undefined
    expect(recursiveGet({foo: undefined}, 'foo.bar')).to.be.undefined
    expect(recursiveGet({foo: 0}, 'foo.bar')).to.be.undefined
    expect(recursiveGet([1, 2, 3], '1')).to.equal(2)
    expect(recursiveGet({foo: [1, {bar: 2}, 3]}, 'foo.1.bar')).to.equal(2)
  })
})

describe('Is object', () => {
  it('should correct', () => {
    expect(isObject(null)).to.be.false
    expect(isObject(undefined)).to.be.false
    expect(isObject(false)).to.be.false
    expect(isObject(0)).to.be.false
    expect(isObject('hi')).to.be.false
    expect(isObject({})).to.be.true
    expect(isObject(new String(''))).to.be.true
  })
})

describe('Recursive set', () => {
  it('should set correct value', () => {
    const obj = {d: {e: 'f'}}
    recursiveSet(obj, 'a.b', 'c')
    expect(obj.a.b).to.equal('c')
    recursiveSet(obj, 'd.e', 'g')
    expect(obj.d.e).to.equal('g')
    recursiveSet(obj, 'f.1', 'h')
    expect(obj.f).to.eql({ 1: 'h' })
    let obj1
    recursiveSet(obj1, 'd.e', 'g')
    recursiveSet(1, 'd.e', 'g')
    obj1 = {foo: [1]}
    recursiveSet(obj1, 'foo.1', 2)
    expect(obj1.foo).to.eql([1, 2])
  })
})

describe('Recursive has', () => {
  it('should check correctly', () => {
    expect(recursiveHas({a: {b: false}}, 'a.b')).to.equal(true)
    expect(recursiveHas({a: {b: undefined}}, 'a.b')).to.equal(true)
    expect(recursiveHas({a: {b: undefined}}, 'a.b.c')).to.equal(false)
    expect(recursiveHas({a: {b: null}}, 'a.b.c')).to.equal(false)
    expect(recursiveHas({a: {b: false}}, 'a.b')).to.equal(true)
    expect(recursiveHas({a: {b: null}}, 'a.b')).to.equal(true)
    expect(recursiveHas({a: {}}, 'a.b')).to.equal(false)
    expect(recursiveHas({}, 'a.b')).to.equal(false)
    expect(recursiveHas({a: [1,2,3]}, 'a.2')).to.equal(true)
    expect(recursiveHas({a: [1,2,3]}, 'a.4')).to.equal(false)
    let x
    expect(recursiveHas(x, 'a.b')).to.equal(false)
  })
})

describe('String checker', () => {
  it('should check correctly', () => {
    expect(isString('')).to.equal(true)
    expect(isString('hi')).to.equal(true)
    expect(isString(new String('abc'))).to.equal(true)
    expect(isString(123)).to.equal(false)
    expect(isString(false)).to.equal(false)
    expect(isString(null)).to.equal(false)
    expect(isString(undefined)).to.equal(false)
    expect(isString()).to.equal(false)
  })
})

describe('Recursive default', () => {
  it('should check correctly', () => {
    const obj = {a: {b: 'c'}}
    recursiveDefault(obj, 'a.b', 'd')
    expect(obj).to.eql({a: {b: 'c'}})
    recursiveDefault(obj, 'a.a1.a2', 3)
    expect(obj).to.eql({
      a: {
        b: 'c',
        a1: {
          a2: 3
        }
      }
    })
  })
})
