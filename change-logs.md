# Change logs

## Version 0.0.12

- Handle optional array transformer

E.g. `transformer(['foo', 'bar'])`, `body` has none of these key

Old: transformer is always called

New: transformer only get called if `force` option is on. i.e. with `transformer(['foo', 'bar'], {force: true})`
