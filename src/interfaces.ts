import {Request, RequestHandler} from 'express'

export type ITransformOptions = {
	force?: boolean
	validateOnly?: boolean
}

export interface ITransformCallbackOptions {
	location: string
	path: string | string[]
	req: Request
}

export type ITransformCallbackSingle<T, V> = (
	value: T, options: ITransformCallbackOptions
) => V | T | void | Promise<V | T | void>
export type ITransformCallbackPlural<T, V> = (
	value: T[], options: ITransformCallbackOptions
) => V[] | T[] | void | Promise<V[] | T[] | void>
export type ITransformCallback<T, V> = ITransformCallbackSingle<T, V> | ITransformCallbackPlural<T, V>
export type IMessageCallback<T> = string | ((value: T | T[], options: ITransformCallbackOptions) => string | Promise<string>)

export interface ITransformer<T, V> extends RequestHandler {
	transform(callback: ITransformCallback<T, V>, options?: ITransformOptions): ITransformer<T, V>
	message(
		callback: IMessageCallback<T>,
		options?: {force?: boolean}
	): ITransformer<T, V>
	[key: string]: (pluginOptions: any) => ITransformer<T, V>
}

export type ITransformPlugin = {
	name: string
	transform: <Option, T, V>(options: Option) => (value: T, callbackOptions: ITransformCallbackOptions) => V | void
	options?: ITransformOptions
}
