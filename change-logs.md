# Change logs

## Version 1.2.0
- Support `pathSplits` value in the info parameter to the transform callback.
- Change the format of `path` value in the info parameter to when indicating array elements.

## Version 1.1.0
- Breaking changes: change `recursiveGet`, `recursiveHas`, `recursiveSet` to accept array strings. (Old: accept `path` as a string).
- Add new transformer options: `rawPath`, `rawLocation`, `disableArrayNotation`.

## Version 1.0.0
- Always throw error if a transformation fails
- **Support array of arrays**
- Support plugin
- Pass transformer options to callback, and remove the `location` property from the info parameter.

## Version 0.3.3
- Update types of `.message` transformer

## Version 0.3.2
- Revert 0.3.1

## Version 0.3.1
- Allow `path` to be empty string (`''`)

## Version 0.3.0
- Integrate `transformOption` into `isIn`, `isFloat`, `isInt`, `matches`, `isLength`
- Add `toDate` API

## Version 0.1.0

- Support array handling

    E.g. `transformer('foo.bar[].fooo.baar[]')` will transform all elements of array `req.body.foo.bar`, on each element, check its `fooo.baar`, then pass each element to the transformer callback

    `force` option behaviour. Because of common practise, intended value should be ((array) or (not defined unless `force` is on)) eventually. In other words,

    + If value is not set:
      * `force` is on: set value be `[]`
      * `force` is off. Ignore and quit process
    + If value is set
      * Value is not array type (`Array.isArray()`): force(set) value be `[]`
      * Value is array: continue process

    Multiple brackets can be passed. e.g. `transformer('foo.bar[].fooo.baaar[].foo[].bar')`

    To process single array element. Use dot notation. `transformer('foo.bar.1.2.foo.0')`) will transform `req.body.foo.bar[1][2].foo[0]`

## Version 0.0.12

- Handle optional array transformer

E.g. `transformer(['foo', 'bar'])`, `body` has none of these key

Old: transformer is always called

New: transformer only get called if `force` option is on. i.e. with `transformer(['foo', 'bar'], {force: true})`
