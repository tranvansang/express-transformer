import {Request, RequestHandler} from 'express'

export type ITransformOptions = {
	force?: boolean
	validateOnly?: boolean
}

export interface ITransformCallbackOptionsSingular {
	location: string
	path: string
	req: Request
}
export interface ITransformCallbackOptionsPlural {
	location: string
	path: string[]
	req: Request
}
export type ITransformCallbackOptions = ITransformCallbackOptionsSingular | ITransformCallbackOptionsPlural

type Promisable<T> = T | Promise<T>

export type ITransformCallbackSingular<T, V> = (
	value: T, options: ITransformCallbackOptionsSingular
) => Promisable<V | T | void>
export type ITransformCallbackPlural<T, V> = (
	value: T[], options: ITransformCallbackOptionsPlural
) => Promisable<V[] | T[] | void>
export type ITransformCallback<T, V> = ITransformCallbackSingular<T, V> | ITransformCallbackPlural<T, V>
export type IMessageCallback<T> = string | ((value: T | T[], options: ITransformCallbackOptions) => Promisable<string>)

export interface ITransformer<T, V> extends RequestHandler {
	transform(callback: ITransformCallback<T, V>, options?: ITransformOptions): ITransformer<T, V>
	message(
		callback: IMessageCallback<T>,
		options?: {force?: boolean}
	): ITransformer<T, V>
	[key: string]: (...pluginOptions: any[]) => any
}

export type ITransformPlugin = {
	name: string
	getConfig: <Params extends []>(
		...params: Params
	) => {
		transform<T, V>(
			value: T | T[], callbackOptions: ITransformCallbackOptions
		): Promisable<T | T[] | V | V[] | void>
		options?: ITransformOptions
	}
}
