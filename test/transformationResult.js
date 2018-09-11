import {expect} from 'chai'
import {transformationResult} from '../src/transformer'

describe('Transformation result', () => {
  it('should return correct result', () => {
    expect(transformationResult({})).to.eql([])
    expect(transformationResult({__transformationErrors: 1})).to.equal(1)
  })
})
