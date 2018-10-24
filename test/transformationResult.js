import {expect} from 'chai'
import {transformationResult, errorKey} from '../src/transformer'

describe('Transformation result', () => {
  it('should return correct result', () => {
    expect(transformationResult({})).to.eql([])
    expect(transformationResult({[errorKey]: 1})).to.equal(1)
  })
})
