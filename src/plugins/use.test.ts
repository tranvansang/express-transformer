/* eslint-disable import/no-extraneous-dependencies */
import {Request, Response} from 'express'
import {combineToAsync} from 'middleware-async'
import {transformer} from '../transformer'
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
	})
})
