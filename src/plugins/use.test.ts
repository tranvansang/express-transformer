/* eslint-disable import/no-extraneous-dependencies */
import {Request, Response} from 'express'
import {combineToAsync} from 'middleware-async'
import {addTransformerPlugin, transformer} from '../transformer'
import flipPromise from 'flip-promise'
import exists from './exists'
import isLength from './isLength'
import isType from './isType'

describe('Transform Plugin', () => {
	test('use plugin', async () => {
		const req = {body: {}}
		req.body.key = 'foo is not bar'
		await combineToAsync(
			transformer('key').use([
				[exists],
				[isLength, {min: 1}],
				[isType, 'string']
			]),
		)(req as Request, undefined as unknown as Response)
		await combineToAsync(
			transformer('key').use([
				['exists'],
				[isLength, {min: 1}],
				['isType', 'string'],
			]),
		)(req as Request, undefined as unknown as Response)

		//invalid plugin name
		await flipPromise((async () => combineToAsync(
			transformer('key').use([
				['exists'],
				[isLength, {min: 1}],
				['isType', 'string'],
				['a', 'string'],
			]),
		)(req as Request, undefined as unknown as Response))())
		req.body.key = ''
		await combineToAsync(
			transformer('key').use([
				[exists, {acceptEmptyString: true}],
			]),
		)(req as Request, undefined as unknown as Response)
		await flipPromise(combineToAsync(
			transformer('key').use([
				[exists, {acceptEmptyString: false}],
			]),
		)(req as Request, undefined as unknown as Response))

		//check iteration order
		req.body.key = 2
		const name = 'a random plugin name'
		addTransformerPlugin({
			name,
			getConfig(){
				return {
					transform(value){
						return value + 1
					}
				}
			}
		})
		addTransformerPlugin({
			name,
			getConfig(){
				return {
					transform(value){
						return value - 1
					}
				}
			}
		})
		await combineToAsync(
			transformer('key').use([
				[name],
				['isType', 'number'],
			]),
		)(req as Request, undefined as unknown as Response)
		expect(req.body.key).toBe(1)
	})

	test('use of use', async () => {
		const req = {body: {key: '1'}}
		await combineToAsync(
			transformer('key').use([
				[exists],
				['use', [
					['toInt'],
					['transform', v => v + 1]
				]],
			]),
		)(req as Request, undefined as unknown as Response)
		expect(req.body.key).toBe(2)
	})

	test('use with message', async () => {
		const req = {body: {} }
		const err = await flipPromise(combineToAsync(
			transformer('key').use([
				[exists],
				['use', [
					['message', 'custom message'],
				]],
			]),
		)(req as Request, undefined as unknown as Response))
		expect(err.message).toBe('custom message')
	})
})
