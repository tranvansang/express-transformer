/* eslint-disable import/no-extraneous-dependencies */
import chai, {expect} from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import {stub} from 'sinon'
import {combineToAsync} from 'middleware-async'
import {validateTransformation} from './helper'
import transformer from '../src/transformer'

chai.use(sinonChai)
chai.use(chaiAsPromised)

describe('Transformer library', () => {
  it('should break if transformer throws error', async () => {
    await expect(combineToAsync(
      transformer('any').transform(() => {
        throw new Error('hi')
      }),
      validateTransformation
    )({body: {any: undefined}})).to.eventually.be.rejected
  })

  it('should transform value', async () => {
    const req = {body: {key: 1}}
    await combineToAsync(
      transformer('key').transform(key => key + 1),
      validateTransformation
    )(req)
    expect(req.body.key).to.equal(2)
  })

  it('should look at correct location', async () => {
    const check = stub()
    await combineToAsync(
      transformer('key', {location: 'params'}).transform(val => {
        check(val)
        return val
      }),
      validateTransformation
    )({body: {key: 1}, params: {key: 2}})
    expect(check).to.have.been.calledOnceWithExactly(2)
  })

  it('should look at correct multilevel location', async () => {
    const check = stub()
    await combineToAsync(
      transformer('deeper.level', {location: 'body.foo.bar'}).transform(val => {
        check(val)
        return val
      }),
      validateTransformation
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
    })
    expect(check).to.have.been.calledOnceWithExactly(2)
  })

  it('should chain transformer', async () => {
    const req = {body: {key: 1}}
    await combineToAsync(
      transformer('key')
        .transform(key => key + 1)
        .transform(key => key + 1),
      validateTransformation
    )(req)
    expect(req.body.key).to.equal(3)
  })

  it('should not go next if error', async () => {
    const check = stub()
    const req = {body: {key: 1}}
    await expect(combineToAsync(
      transformer('key')
        .transform(() => {
          throw 'err'
        })
        .transform(key => {
          check()
          return key + 1
        }),
      validateTransformation
    )(req)).to.eventually.be.rejected
    expect(req.body.key).to.equal(1)
    expect(check).to.not.have.been.called
  })

  it('should go next if nonstop is on', async () => {
    const check = stub()
    const req = {body: {key: 1}}
    await expect(combineToAsync(
      transformer('key', {nonstop: true})
        .transform(() => {
          throw 'err'
        })
        .transform(key => {
          check()
          return key + 1
        }),
      validateTransformation
    )(req)).to.eventually.be.rejected
    expect(req.body.key).to.equal(2)
    expect(check).to.have.been.calledOnceWithExactly()
  })

  // it('should throw error if location contains dot', () => {
  //   expect(() => transformer(null, {location: '.'})).to.throw()
  // })

  it('should ignore value if not provded', async () => {
    const check = stub()
    await combineToAsync(
      transformer('key').transform(() => check()),
      validateTransformation
    )({})
    expect(check).to.not.have.been.called
  })

  it('should not ignore value if forced', async () => {
    const check = stub()
    await combineToAsync(
      transformer('key').transform(() => check(), {force: true}),
      validateTransformation
    )({})
    expect(check).to.have.been.called
  })

  it('should not ignore falsy', async () => {
    for (const val of [undefined, null, '', 0]) {
      const check = stub()
      await combineToAsync(
        transformer('key').transform(() => check()),
        validateTransformation
      )({body: {key: val}})
      expect(check).to.have.been.called
    }
  })

  it('should pass correct param to callback', async () => {
    const check = stub()
    const req = {body: {key: 1}}
    await combineToAsync(
      transformer('key').transform(check),
      validateTransformation
    )(req)
    expect(check).to.have.been.calledOnceWithExactly(1, {
      location: 'body',
      path: 'key',
      req
    })
  })

  it('should call message on non-provided value', async () => {
    const check = stub()
    await combineToAsync(
      transformer('key').message(check),
      validateTransformation
    )({})
    expect(check).to.have.been.calledOnce
  })

  it('should call message for array value', async () => {
    const check = stub()
    await combineToAsync(
      transformer(['key1', 'key2']).message(check),
      validateTransformation
    )({})
    expect(check).to.have.been.calledOnce
  })

  describe('array handling', () => {
    it('should process array', async () => {
      const check = stub()
      await combineToAsync(
        transformer('key[]').transform(check),
        validateTransformation
      )({})
      expect(check).to.not.have.been.called
    })

    it('should set empty array with force', async () => {
      const check = stub()
      const req = {}
      await combineToAsync(
        transformer('key[]').transform(check, {force: true}),
        validateTransformation
      )(req)
      expect(check).to.not.have.been.called
      expect(req.body.key).to.eql([])
    })

    it('should set empty array without force', async () => {
      const check = stub()
      const req = {body: {key: {not_an_obj: 123}}}
      await combineToAsync(
        transformer('key[]').transform(check),
        validateTransformation
      )(req)
      expect(check).to.not.have.been.called
      expect(req.body.key).to.eql([])
    })
    it('should process with array last', async () => {
      const req = {body: {key: [1]}}
      await combineToAsync(
        transformer('key[]').transform(x => x + 1),
        validateTransformation
      )(req)
      expect(req.body.key[0]).to.equal(2)
    })

    it('should process transformer', async () => {
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
        transformer('long.path.around.arrayWrapper[].long.path.around.myArray[].key1').transform(x => x + 1),
        transformer('long.path.around.arrayWrapper[].long.path.around.myArray[].key2').transform(x => x * 2),
        validateTransformation
      )(req)
      expect(req).to.eql({
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
