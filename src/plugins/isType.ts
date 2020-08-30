import {ITransformOptions, ITransformPlugin} from '../interfaces'
import {TransformationError} from '../transformer'

type JSTypeToType = {
	string: string
	number: number
	boolean: boolean
	function: (...args: any[]) => any
	bigint: bigint
	object: any | null
	undefined: undefined
	symbol: symbol
}
type JSType = keyof JSTypeToType
declare global {
	namespace ExpressTransformer {
		export interface ITransformer<T, V, Options> {
			isType<Type extends JSType>(
				type: Type,
				options?: Omit<ITransformOptions, 'validateOnly'>
			): ITransformer<T & JSTypeToType[Type], V, Options>
		}
	}
}

export default {
	name: 'isType',
	getConfig<T>(type: JSType, options?: Omit<ITransformOptions, 'validateOnly'>) {
		return {
			transform(val: T, info) {
				if (typeof val !== type) throw new TransformationError(
					`${info.path} must be of type ${type}`,
					info
				)
			},
			options: {...options, validateOnly: true}
		}
	}
} as ITransformPlugin
