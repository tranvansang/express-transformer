import {errorKey, transformationResult} from '../src/transformer'

describe('Transformation result', () => {
  test('should return correct result', () => {
    expect(transformationResult({})).toEqual([])
    expect(transformationResult({[errorKey]: 1})).toBe(1)
  })
})
