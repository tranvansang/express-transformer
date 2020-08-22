// eslint-disable-next-line import/no-extraneous-dependencies,@typescript-eslint/no-unused-vars
import {Request, RequestHandler} from 'express'

type IRequestHandler = RequestHandler | IRequestHandlerArray
type IRequestHandlerArray = ReadonlyArray<IRequestHandler>

declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> extends RequestHandler {
			message(
				callback: IMessageCallback<T, Options>,
				options?: IMessageOptions
			): ITransformer<T, V, Options>
		}
	}
}

export type ITransformOptions = {
	force?: boolean
	validateOnly?: boolean
}

export type ITransformerOptions = {
	location?: string
	rawPath?: boolean
	rawLocation?: boolean
	disableArrayNotation?: boolean
}

export interface ITransformCallbackInfoSingular<Options> {
	options: Options & ITransformerOptions
	path: string
	req: Request
	pathSplits: Array<string | number>
}
export interface ITransformCallbackInfoPlural<Options> {
	options: Options & ITransformerOptions
	path: string[]
	pathSplits: Array<Array<string | number>>
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
export type ITransformCallback<T, V, Options> = ITransformCallbackSingular<T, V, Options>
	| ITransformCallbackPlural<T, V, Options>
export type IMessageCallback<T, Options> = string
	| ((value: T | T[], options: ITransformCallbackInfo<Options>) => Promisable<string>)
export type IMessageOptions = {
	global?: boolean
	disableOverwriteWarning?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ITransformer<T, V, Options> extends ExpressTransformer.ITransformer<T, V, Options> {}

type MaybeArray<T> = T | Array<T>
export type ITransformPluginConfig = {
	transform<T, V, Options>(
		value: T | T[], callbackOptions: ITransformCallbackInfo<Options>
	): Promisable<T | T[] | V | V[] | void>
	options?: ITransformOptions
}
export type ITransformPlugin = {
	name: string
	getConfig: <Params extends []>(
		...params: Params
	) => MaybeArray<ITransformPluginConfig>
}
