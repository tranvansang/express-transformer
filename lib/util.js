"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isString = exports.recursiveHas = exports.recursiveDefault = exports.recursiveGet = exports.recursiveSet = exports.isObject = void 0;

var isObject = function isObject(obj) {
  return obj instanceof Object;
};

exports.isObject = isObject;

var recursiveSet = function recursiveSet(obj, path, value) {
  return path.split('.').reduce(function (acc, cur, index, pathArray) {
    if (!isObject(acc)) return undefined;
    if (index === pathArray.length - 1) acc[cur] = value;else acc[cur] = acc.hasOwnProperty(cur) ? acc[cur] : {};
    return acc[cur];
  }, obj || {});
};

exports.recursiveSet = recursiveSet;

var recursiveGet = function recursiveGet(obj, path, value) {
  return path.split('.').reduce(function (acc, cur, index, pathArray) {
    return isObject(acc) && acc.hasOwnProperty(cur) ? acc[cur] : index === pathArray.length - 1 ? value : undefined;
  }, obj);
};

exports.recursiveGet = recursiveGet;

var recursiveDefault = function recursiveDefault(obj, path, defaultValue) {
  if (!recursiveHas(obj, path)) recursiveSet(obj, path, defaultValue);
};

exports.recursiveDefault = recursiveDefault;

var recursiveHas = function recursiveHas(obj, path) {
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
      if (!_iteratorNormalCompletion && _iterator.return != null) {
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

exports.recursiveHas = recursiveHas;

var isString = function isString(str) {
  return typeof str === 'string' || str instanceof String;
};

exports.isString = isString;