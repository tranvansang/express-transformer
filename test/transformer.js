/* eslint-disable import/no-extraneous-dependencies */
import chai, {expect} from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import {combineToAsync} from 'middleware-async'
import {validateTransformation} from './helper'
import transformer, {TransformationError, transformationResult} from '../src/transformer'
import {match, stub} from 'sinon'

chai.use(sinonChai)
chai.use(chaiAsPromised)


const clearErrs = req => {
  const errs = transformationResult(req)
  errs.splice(0, errs.length)
}

describe('Transform', () => {
  let req
  beforeEach(() => {
    req  = {body: {}}
  })

  it('should check message', async () => {
    await expect(combineToAsync(
      transformer('key').message(() => 'hi').exists(),
      validateTransformation
    )({})).to.eventually.be.rejectedWith('hi')
  })

  it('should accept constant message string', async () => {
    await expect(combineToAsync(
      transformer('key').message('hi').exists(),
      validateTransformation
    )({})).to.eventually.be.rejectedWith('hi')
  })

  it('should accept ignore message and get TransformationError', async () => {
    const obj = {a: 1, b: 2}
    const err = new TransformationError(obj)
    await expect(combineToAsync(
      transformer('key').message('hi').transform(() => Promise.reject(err), {force: true}),
      validateTransformation
    )({})).to.eventually.be.rejectedWith(obj)
  })

  it('should accept take message and ignore uncontrolled error in transformer', async () => {
    await expect(combineToAsync(
      transformer('key').message('hi').transform(() => Promise.reject(new Error('hello')), {force: true}),
      validateTransformation
    )({})).to.eventually.be.rejectedWith('hi')
  })

  it('should invalidate value if message callback throws error', async () => {
    await expect(combineToAsync(
      transformer('key').message(() => Promise.reject(1)),
      validateTransformation
    )({body: {key: 'hi'}})).to.eventually.be.rejected
  })

  it('should check exist', async () => {
    await expect(combineToAsync(
      transformer('key').exists(),
      validateTransformation
    )({})).to.eventually.be.rejected
    for (const val of [undefined, null, '']) {
      await expect(combineToAsync(
        transformer('key').exists(),
        validateTransformation
      )({body: {key: val}})).to.eventually.be.rejected
    }
    for (const val of [0, false, true, 1, 'hii'])
      await combineToAsync(
        transformer('key').exists(),
        validateTransformation
      )({body: {key: val}})
    await combineToAsync(
      transformer('key').exists({acceptEmptyString: true}),
      validateTransformation
    )({body: {key: ''}})
  })

  it('should trim', async () => {
    const req = {body: {key: ' 12  '}}
    await combineToAsync(
      transformer('key').trim(),
      validateTransformation
    )(req)
    expect(req.body.key).to.equal('12')

    clearErrs(req)
    req.body.key = 123
    await combineToAsync(
      transformer('key').trim(),
      validateTransformation
    )(req)
    expect(req.body.key).to.equal(123)
  })

  it('should set default', async () => {
    const req = {body: {key: 'foo', key2: null, key3: ''}}
    await combineToAsync(
      transformer('key1').defaultValue('bar'),
      transformer('key').defaultValue('bar'),
      transformer('key2').defaultValue('bar'),
      transformer('key3').defaultValue('bar'),
      validateTransformation
    )(req)
    expect(req).to.eql({
      body: {
        key: 'foo',
        key1: 'bar',
        key2: 'bar',
        key3: 'bar'
      }
    })
  })

  it('should check to int', async () => {
    const req = {body: {key: '1'}}
    await combineToAsync(
      transformer('key').toInt(),
      validateTransformation
    )(req)
    expect(req.body.key).to.equal(1)

    clearErrs(req)
    req.body.key = 12
    await combineToAsync(
      transformer('key').toInt(),
      validateTransformation
    )(req)
    expect(req.body.key).to.equal(12)

    clearErrs(req)
    req.body.key = '1.2'
    await expect(combineToAsync(
      transformer('key').toInt(),
      validateTransformation
    )(req)).to.eventually.be.rejected
    expect(req.body.key).to.equal('1.2')

    clearErrs(req)
    req.body.key = '1'
    await expect(combineToAsync(
      transformer('key').toInt({min: 3}),
      validateTransformation
    )(req)).to.eventually.be.rejected
    expect(req.body.key).to.equal('1')

    clearErrs(req)
    req.body.key = '1'
    await expect(combineToAsync(
      transformer('key').toInt({max: 0}),
      validateTransformation
    )(req)).to.eventually.be.rejected
    expect(req.body.key).to.equal('1')

    clearErrs(req)
    req.body.key = 'abc'
    await expect(combineToAsync(
      transformer('key').toInt({max: 0}),
      validateTransformation
    )(req)).to.eventually.be.rejected
    expect(req.body.key).to.equal('abc')
  })

  it('should check to float', async () => {
    const req = {body: {key: '1.5'}}
    await combineToAsync(
      transformer('key').toFloat(),
      validateTransformation
    )(req)
    expect(req.body.key).to.equal(1.5)

    clearErrs(req)
    req.body.key = 12.3
    await combineToAsync(
      transformer('key').toFloat(),
      validateTransformation
    )(req)
    expect(req.body.key).to.equal(12.3)

    clearErrs(req)
    req.body.key = '1.5'
    await expect(combineToAsync(
      transformer('key').toFloat({min: 3}),
      validateTransformation
    )(req)).to.eventually.be.rejected
    expect(req.body.key).to.equal('1.5')

    clearErrs(req)
    req.body.key = '1.7'
    await expect(combineToAsync(
      transformer('key').toFloat({max: 0}),
      validateTransformation
    )(req)).to.eventually.be.rejected
    expect(req.body.key).to.equal('1.7')

    clearErrs(req)
    req.body.key = undefined
    await expect(combineToAsync(
      transformer('key').toFloat({max: 0}),
      validateTransformation
    )(req)).to.eventually.be.rejected
    expect(req.body.key).to.be.undefined

    clearErrs(req)
    req.body.key = 'a123'
    await expect(combineToAsync(
      transformer('key').toFloat({max: 0}),
      validateTransformation
    )(req)).to.eventually.be.rejected
    expect(req.body.key).to.equal('a123')
  })

  it('should check other', async () => {

    req.body.key = '4538136094603680'
    await combineToAsync(
      transformer('key').isCreditCard(),
      validateTransformation
    )(req)

    clearErrs(req)
    req.body.key = '12'
    await expect(combineToAsync(
      transformer('key').isCreditCard(),
      validateTransformation
    )(req)).to.eventually.be.rejected

    clearErrs(req)
    req.body.key = '1'
    await combineToAsync(
      transformer('key').isIn(['1', '3']),
      validateTransformation
    )(req)

    clearErrs(req)
    req.body.key = '2'
    await expect(combineToAsync(
      transformer('key').isIn(['1', '3']),
      validateTransformation
    )(req)).to.eventually.be.rejected

    clearErrs(req)
    req.body.key = '123456'
    await expect(combineToAsync(
      transformer('key').isLength({min: 1, max: 5}),
      validateTransformation
    )(req)).to.eventually.be.rejected

    clearErrs(req)
    req.body.key = 123
    await expect(combineToAsync(
      transformer('key').isLength({min: 1, max: 5}),
      validateTransformation
    )(req)).to.eventually.be.rejected

    clearErrs(req)
    req.body.key = ''
    await expect(combineToAsync(
      transformer('key').isLength({min: 1, max: 5}),
      validateTransformation
    )(req)).to.eventually.be.rejected

    clearErrs(req)
    req.body.key = '123'
    await combineToAsync(
      transformer('key').isLength({min: 1, max: 5}),
      validateTransformation
    )(req)

    clearErrs(req)
    req.body.key = 'test@gmail.com'
    await combineToAsync(
      transformer('key').isEmail(),
      validateTransformation
    )(req)

    clearErrs(req)
    req.body.key = 'abc'
    await expect(combineToAsync(
      transformer('key').isEmail(),
      validateTransformation
    )(req)).to.eventually.be.rejected

    clearErrs(req)
    req.body.key = '123abcd'
    await combineToAsync(
      transformer('key').matches(/abc/),
      validateTransformation
    )(req)

    clearErrs(req)
    req.body.key = 'a123'
    await expect(combineToAsync(
      transformer('key').matches(/^\d*$/),
      validateTransformation
    )(req)).to.eventually.be.rejected

    clearErrs(req)
    req.body.key = 123
    await expect(combineToAsync(
      transformer('key').toDate(),
      validateTransformation
    )(req)).to.eventually.be.rejected

    clearErrs(req)
    req.body.key = 123
    await expect(combineToAsync(
      transformer('key').isEmail(),
      validateTransformation
    )(req)).to.eventually.be.rejected

    clearErrs(req)
    req.body.key = new Date().toISOString()
    await combineToAsync(
      transformer('key').toDate(),
      validateTransformation
    )(req)

    clearErrs(req)
    req.body.key = 1
    const inc = x => new Promise(resolve => setTimeout(() => resolve(x + 1), 1))
    await combineToAsync(
      transformer('key')
        .transform(async val => await inc(val))
        .transform(inc),
      validateTransformation
    )(req)
    expect(req.body.key).to.equal(3)
  })

  it('should stop in the first err', async () => {
    clearErrs(req)
    req.body.key = 1
    await expect(combineToAsync(
      transformer('key')
        .transform(async val => Promise.reject(1)),
      transformer('key')
        .transform(val => val + 2),
      validateTransformation
    )(req)).to.eventually.be.rejected
    expect(req.body.key).to.equal(1)
  })

  it('should work on array', async () => {
    // clearErrs(req)
    // req.body.key1 = 1
    // req.body.key2 = 2
    // await combineToAsync(
    //   transformer(['key1', 'key2'])
    //     .transform(([key1, key2]) => [key1 + key2, key2]),
    //   validateTransformation
    // )(req)
    // expect(req.body.key1).to.equal(3)
    // expect(req.body.key2).to.equal(2)

    clearErrs(req)
    delete req.body.key1
    delete req.body.key2
    const check = stub()
    await combineToAsync(
      transformer(['key1', 'key2'])
        .transform(check),
      validateTransformation
    )(req)
    expect(check).to.have.been.calledOnceWithExactly([undefined, undefined], match.any)
  })

  it('should validate array', async () => {
    clearErrs(req)
    delete req.body.key1
    req.body.key2 = '1'
    let check = stub()
    await combineToAsync(
      transformer(['key2', 'key1'])
        .each(check),
      validateTransformation
    )(req)
    expect(check).to.have.been.calledOnceWithExactly('1', match.any)

    clearErrs(req)
    delete req.body.key1
    req.body.key2 = '1'
    check = stub()
    await combineToAsync(
      transformer(['key2', 'key1'])
        .each(check, {force: true}),
      validateTransformation
    )(req)
    expect(check).to.have.been.calledTwice

    clearErrs(req)
    delete req.body.key1
    req.body.key2 = '1'
    await expect(combineToAsync(
      transformer(['key2', 'key1'])
        .exists(),
      validateTransformation
    )(req)).to.eventually.be.rejected

    clearErrs(req)
    delete req.body.key1
    req.body.key2 = 1
    req.body.key1 = 3
    await combineToAsync(
      transformer(['key2', 'key1'])
        .each(val => val + 1),
      validateTransformation
    )(req)
    expect(req.body.key2).to.equal(2)
    expect(req.body.key1).to.equal(4)
  })

  it('should reject something dirty', async () => {
    req.__validationErrors = Object.create(null)
    await expect(combineToAsync(
      transformer('key').exists(),
      validateTransformation
    )()).to.eventually.be.rejected
  })
})