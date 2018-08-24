'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var isObject = exports.isObject = function isObject(obj) {
  return obj instanceof Object;
};

var recursiveSet = exports.recursiveSet = function recursiveSet(obj, path, value) {
  return path.split('.').reduce(function (acc, cur, index, pathArray) {
    if (!isObject(acc)) return undefined;
    if (index === pathArray.length - 1) acc[cur] = value;else acc[cur] = acc.hasOwnProperty(cur) ? acc[cur] : {};
    return acc[cur];
  }, obj || {});
};

var recursiveGet = exports.recursiveGet = function recursiveGet(obj, path, value) {
  return path.split('.').reduce(function (acc, cur, index, pathArray) {
    return isObject(acc) && acc.hasOwnProperty(cur) ? acc[cur] : index === pathArray.length - 1 ? value : undefined;
  }, obj);
};

var recursiveDefault = exports.recursiveDefault = function recursiveDefault(obj, path, defaultValue) {
  if (!recursiveHas(obj, path)) recursiveSet(obj, path, defaultValue);
};

var recursiveHas = exports.recursiveHas = function recursiveHas(obj, path) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = path.split('.')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var key = _step.value;

      if (isObject(obj) && obj.hasOwnProperty(key)) {
        obj = obj[key];
      } else return false;
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return true;
};

var isString = exports.isString = function isString(str) {
  return typeof str === 'string' || str instanceof String;
};