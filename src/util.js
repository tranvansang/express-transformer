export const isObject = obj =>
  obj instanceof Object

export const recursiveSet =
  (obj, path, value) => path
    .split('.')
    .reduce((acc, cur, index, pathArray) => {
        if (!isObject(acc)) return undefined
        if (index === pathArray.length - 1)
          acc[cur] = value
        else
          acc[cur] = acc.hasOwnProperty(cur) ? acc[cur] : {}
        return acc[cur]
      },
      obj || {}
    )

export const recursiveGet =
  (obj, path, value) => path
    .split('.')
    .reduce((acc, cur, index, pathArray) =>
        isObject(acc) && acc.hasOwnProperty(cur)
          ? acc[cur]
          : (index === pathArray.length - 1 ? value : undefined),
      obj
    )

export const recursiveDefault =
  (obj, path, defaultValue) => {
    if (!recursiveHas(obj, path))
      recursiveSet(obj, path, defaultValue)
  }

export const recursiveHas =
  (obj, path) => {
    for (const key of path.split('.'))
      if (isObject(obj) && obj.hasOwnProperty(key)) {
        obj = obj[key]
      } else return false
    return true
  }

export const isString = str =>
  typeof str === 'string' || str instanceof String