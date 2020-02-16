export const recursiveSet = <T, V>(obj: T, path: string, value: V) => path
	.split('.')
	.reduce((acc: any, cur: string, index, pathArray) => {
		if (!(acc instanceof Object)) return undefined
		if (index === pathArray.length - 1) acc[cur] = value
		else acc[cur] = Object.prototype.hasOwnProperty.call(acc, cur) ? acc[cur] : {}
		return acc[cur]
	},
	obj || {}
	)
export const recursiveGet = <T, V>(obj: T, path: string, value?: V) => path
	.split('.')
	.reduce((
		acc: any, cur, index, pathArray
	) => acc instanceof Object && Object.prototype.hasOwnProperty.call(acc, cur)
		? acc[cur]
		: index === pathArray.length - 1 ? value : undefined,
	obj
	)
export const recursiveHas = (obj: any, path: string) => {
	for (const key of path.split('.')) if (
		obj instanceof Object && Object.prototype.hasOwnProperty.call(obj, key)
	) {
		obj = obj[key]
	} else return false
	return true
}
export const recursiveDefault = <T, V>(obj: T, path: string, defaultValue: V) => {
	if (!recursiveHas(obj, path)) recursiveSet(obj, path, defaultValue)
}
