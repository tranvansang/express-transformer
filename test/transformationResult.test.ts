import {errorKey, transformationResult} from '../src/transformer'
import {Request} from 'express'

describe('Transformation result', () => {
  test('should return correct result', () => {
    expect(transformationResult({} as Request)).toEqual([])
    expect(transformationResult({[errorKey]: 1} as unknown as Request)).toBe(1)
  })
})
