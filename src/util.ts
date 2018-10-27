export const recursiveSet =
  (obj: any, path: string, value: any) => path
    .split('.')
    .reduce((acc, cur, index, pathArray) => {
        if (!(acc instanceof Object)) return undefined
        if (index === pathArray.length - 1)
          acc[cur] = value
        else
          acc[cur] = acc.hasOwnProperty(cur) ? acc[cur] : {}
        return acc[cur]
      },
      obj || {}
    )

type Obj = {[key: string]: Obj} | undefined | any

export const recursiveGet =
  (obj: Obj, path: string, value?: Obj) => path
    .split('.')
    .reduce((acc, cur, index, pathArray) =>
        acc instanceof Object && acc.hasOwnProperty(cur)
          ? acc[cur]
          : (index === pathArray.length - 1 ? value : undefined),
      obj
    )

export const recursiveDefault =
  (obj: Obj, path: string, defaultValue: Obj) => {
    if (!recursiveHas(obj, path))
      recursiveSet(obj, path, defaultValue)
  }

export const recursiveHas =
  (obj: Obj, path: string) => {
    for (const key of path.split('.'))
      if (obj instanceof Object && obj.hasOwnProperty(key)) {
        obj = obj[key]
      } else return false
    return true
  }

export const isString = (str: any) => typeof str === 'string' || str instanceof String
