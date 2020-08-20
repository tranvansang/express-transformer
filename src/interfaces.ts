// eslint-disable-next-line import/no-extraneous-dependencies
import {Request, RequestHandler} from 'express'

export type ITransformOptions = {
	force?: boolean
	validateOnly?: boolean
}

export type ITransformerOptions = {
	location?: string
}

export interface ITransformCallbackInfoSingular<Options> {
	options: Options & ITransformerOptions
	path: string
	req: Request
}
export interface ITransformCallbackInfoPlural<Options> {
	options: Options & ITransformerOptions
	path: string[]
	req: Request
}
export type ITransformCallbackInfo<Options> = ITransformCallbackInfoSingular<Options>
	| ITransformCallbackInfoPlural<Options>

type Promisable<T> = T | Promise<T>

export type ITransformCallbackSingular<T, V, Options> = (
	value: T, options: ITransformCallbackInfoSingular<Options>
) => Promisable<V | T | void>
export type ITransformCallbackPlural<T, V, Options> = (
	value: T[], options: ITransformCallbackInfoPlural<Options>
) => Promisable<V[] | T[] | void>
export type ITransformCallback<T, V, Options> = ITransformCallbackSingular<T, V, Options> | ITransformCallbackPlural<T, V, Options>
export type IMessageCallback<T, Options> = string | ((value: T | T[], options: ITransformCallbackInfo<Options>) => Promisable<string>)

export interface ITransformer<T, V, Options> extends RequestHandler {
	transform(callback: ITransformCallback<T, V, Options>, options?: ITransformOptions): ITransformer<T, V, Options>
	message(
		callback: IMessageCallback<T, Options>,
		options?: {force?: boolean}
	): ITransformer<T, V, Options>
	[key: string]: (...pluginOptions: any[]) => any
}

export type ITransformPlugin = {
	name: string
	getConfig: <Params extends []>(
		...params: Params
	) => {
		transform<T, V, Options>(
			value: T | T[], callbackOptions: ITransformCallbackInfo<Options>
		): Promisable<T | T[] | V | V[] | void>
		options?: ITransformOptions
	}
}
