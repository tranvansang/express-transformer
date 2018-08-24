'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transformationResult = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.TransformationError = TransformationError;

var _util = require('../src/util');

var _validator = require('validator');

var validators = _interopRequireWildcard(_validator);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var isInt = validators.isInt,
    isFloat = validators.isFloat;
function TransformationError(message) {
  this.name = 'TransformationError';
  this.message = message;
}

TransformationError.prototype = Error.prototype;

var transformationResult = exports.transformationResult = function transformationResult(req) {
  return req.__validationErrors || [];
};

//NOTE: transformer ignore value that is not provided by default.
//Check their existence via .exists() or append {force: true} option in .transform(..)

exports.default = function (path) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$location = _ref.location,
      location = _ref$location === undefined ? 'body' : _ref$location,
      _ref$nonstop = _ref.nonstop,
      nonstop = _ref$nonstop === undefined ? false : _ref$nonstop;

  var stack = [];

  var middleware = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(req, res, next) {
      var hasError, message, appendError, fullpath, getValue, setValue, doTransform, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _ref4, type, callback, force, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, p;

      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              hasError = transformationResult(req).length;
              message = null;

              appendError = function appendError(error) {
                req.__validationErrors = req.__validationErrors || [];
                req.__validationErrors.push({
                  location: location, path: path, error: error
                });
              };

              fullpath = function fullpath(p) {
                return location + '.' + p;
              };

              getValue = function getValue(inlinePath) {
                return Array.isArray(inlinePath) ? inlinePath.map(function (p) {
                  return (0, _util.recursiveGet)(req, fullpath(p));
                }) : (0, _util.recursiveGet)(req, fullpath(inlinePath));
              };

              setValue = function setValue(inlinePath, values) {
                return Array.isArray(inlinePath) ? inlinePath.map(function (p, i) {
                  return (0, _util.recursiveSet)(req, fullpath(p), (0, _util.isObject)(values) && values.hasOwnProperty(i) ? values[i] : undefined);
                }) : (0, _util.recursiveSet)(req, fullpath(inlinePath), values);
              };

              doTransform = function () {
                var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(inlinePath, callback, force) {
                  var sanitized, err;
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          if (!(force || Array.isArray(inlinePath) || (0, _util.recursiveHas)(req, fullpath(inlinePath)))) {
                            _context.next = 15;
                            break;
                          }

                          _context.prev = 1;
                          _context.next = 4;
                          return callback(getValue(inlinePath), { req: req, path: inlinePath, location: location });

                        case 4:
                          sanitized = _context.sent;

                          setValue(inlinePath, sanitized);
                          _context.next = 15;
                          break;

                        case 8:
                          _context.prev = 8;
                          _context.t0 = _context['catch'](1);

                          hasError = true;
                          err = void 0;

                          if (message) {
                            err = new TransformationError(message);
                          } else err = _context.t0;
                          appendError(err);
                          return _context.abrupt('return', true);

                        case 15:
                        case 'end':
                          return _context.stop();
                      }
                    }
                  }, _callee, undefined, [[1, 8]]);
                }));

                return function doTransform(_x5, _x6, _x7) {
                  return _ref3.apply(this, arguments);
                };
              }();

              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context2.prev = 11;
              _iterator = stack[Symbol.iterator]();

            case 13:
              if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                _context2.next = 73;
                break;
              }

              _ref4 = _step.value;
              type = _ref4.type, callback = _ref4.callback, force = _ref4.force;

              if (!(!nonstop && hasError)) {
                _context2.next = 18;
                break;
              }

              return _context2.abrupt('break', 73);

            case 18:
              _context2.t0 = type;
              _context2.next = _context2.t0 === 'every' ? 21 : _context2.t0 === 'transformer' ? 55 : _context2.t0 === 'message' ? 59 : 70;
              break;

            case 21:
              if (!Array.isArray(path)) {
                _context2.next = 55;
                break;
              }

              _iteratorNormalCompletion2 = true;
              _didIteratorError2 = false;
              _iteratorError2 = undefined;
              _context2.prev = 25;
              _iterator2 = path[Symbol.iterator]();

            case 27:
              if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                _context2.next = 39;
                break;
              }

              p = _step2.value;
              _context2.t1 = !nonstop;

              if (!_context2.t1) {
                _context2.next = 34;
                break;
              }

              _context2.next = 33;
              return doTransform(p, callback, force);

            case 33:
              _context2.t1 = _context2.sent;

            case 34:
              if (!_context2.t1) {
                _context2.next = 36;
                break;
              }

              return _context2.abrupt('break', 39);

            case 36:
              _iteratorNormalCompletion2 = true;
              _context2.next = 27;
              break;

            case 39:
              _context2.next = 45;
              break;

            case 41:
              _context2.prev = 41;
              _context2.t2 = _context2['catch'](25);
              _didIteratorError2 = true;
              _iteratorError2 = _context2.t2;

            case 45:
              _context2.prev = 45;
              _context2.prev = 46;

              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }

            case 48:
              _context2.prev = 48;

              if (!_didIteratorError2) {
                _context2.next = 51;
                break;
              }

              throw _iteratorError2;

            case 51:
              return _context2.finish(48);

            case 52:
              return _context2.finish(45);

            case 53:
              message = null;
              return _context2.abrupt('break', 70);

            case 55:
              _context2.next = 57;
              return doTransform(path, callback, force);

            case 57:
              message = null;
              return _context2.abrupt('break', 70);

            case 59:
              _context2.prev = 59;
              _context2.next = 62;
              return callback(getValue(), { req: req });

            case 62:
              message = _context2.sent;
              _context2.next = 69;
              break;

            case 65:
              _context2.prev = 65;
              _context2.t3 = _context2['catch'](59);

              hasError = true;
              appendError(_context2.t3);

            case 69:
              return _context2.abrupt('break', 70);

            case 70:
              _iteratorNormalCompletion = true;
              _context2.next = 13;
              break;

            case 73:
              _context2.next = 79;
              break;

            case 75:
              _context2.prev = 75;
              _context2.t4 = _context2['catch'](11);
              _didIteratorError = true;
              _iteratorError = _context2.t4;

            case 79:
              _context2.prev = 79;
              _context2.prev = 80;

              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }

            case 82:
              _context2.prev = 82;

              if (!_didIteratorError) {
                _context2.next = 85;
                break;
              }

              throw _iteratorError;

            case 85:
              return _context2.finish(82);

            case 86:
              return _context2.finish(79);

            case 87:
              next();
              _context2.next = 93;
              break;

            case 90:
              _context2.prev = 90;
              _context2.t5 = _context2['catch'](0);

              next(_context2.t5);

            case 93:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, undefined, [[0, 90], [11, 75, 79, 87], [25, 41, 45, 53], [46,, 48, 52], [59, 65], [80,, 82, 86]]);
    }));

    return function middleware(_x2, _x3, _x4) {
      return _ref2.apply(this, arguments);
    };
  }();
  middleware.transform = function (callback) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    stack.push(_extends({}, options, {
      type: 'transformer',
      callback: callback
    }));
    return middleware;
  };

  middleware.message = function (callback) {
    stack.push({
      type: 'message',
      callback: callback
    });
    return middleware;
  };

  middleware.every = middleware.each = function (callback) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    stack.push(_extends({}, options, {
      type: 'every',
      callback: callback
    }));
    return middleware;
  };

  middleware.exists = function () {
    return middleware.each(function (value, _ref5) {
      var path = _ref5.path;

      if (value === undefined || value === '' || value === null) throw new Error(path + ' is required');
      return value;
    }, { force: true });
  };

  middleware.trim = function () {
    return middleware.each(function (value) {
      if ((0, _util.isString)(value)) return value.trim();
      return value;
    });
  };

  middleware.defaultValue = function (defaultValue) {
    return middleware.each(function (value) {
      return value === undefined || value === '' || value === null ? defaultValue : value;
    }, { force: true });
  };

  // All value checked by validator's function need to be string type

  var _loop = function _loop(vKey, vCallback) {
    if (vKey.startsWith('is')) middleware[vKey] = function () {
      for (var _len = arguments.length, options = Array(_len), _key = 0; _key < _len; _key++) {
        options[_key] = arguments[_key];
      }

      return middleware.each(function (value, _ref13) {
        var path = _ref13.path;

        if (!(0, _util.isString)(value)) throw new Error(path + ' must be a string');
        if (!vCallback.apply(undefined, [value].concat(options))) throw new Error(path + ' is not a valid ' + value.slice(2));
        return value;
      });
    };else if (vKey.startsWith('to')) middleware[vKey] = function () {
      for (var _len2 = arguments.length, options = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        options[_key2] = arguments[_key2];
      }

      return middleware.each(function (value, _ref14) {
        var path = _ref14.path;

        if (!(0, _util.isString)(value)) throw new Error(path + ' must be a string');
        return vCallback.apply(undefined, [value].concat(options));
      });
    };
  };

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = Object.entries(validators)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var _ref6 = _step3.value;

      var _ref7 = _slicedToArray(_ref6, 2);

      var vKey = _ref7[0];
      var vCallback = _ref7[1];

      _loop(vKey, vCallback);
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  middleware.toInt = function () {
    var option = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return middleware.each(function (value, _ref8) {
      var path = _ref8.path;

      var error = false;
      if ((0, _util.isString)(value) && !isInt(value)) error = true;
      if (typeof value === 'number') error = !Number.isInteger(value);else {
        value = parseFloat(value);
        if (isNaN(value)) error = true;
      }
      if (error) throw new Error(path + ' must be an integer');
      if ('min' in option && value < option.min) throw new Error(path + ' must be at least ' + option.min);
      if ('max' in option && value > option.max) throw new Error(path + ' must be at most ' + option.max);
      return value;
    });
  };
  middleware.toFloat = function () {
    var option = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return middleware.each(function (value, _ref9) {
      var path = _ref9.path;

      var error = false;
      if ((0, _util.isString)(value) && !isFloat(value)) error = true;
      if (typeof value !== 'number') {
        value = parseFloat(value);
        if (isNaN(value)) error = true;
      }
      if (error) throw new Error(path + ' must be a number');
      if ('min' in option && value < option.min) throw new Error(path + ' must be at least ' + option.min);
      if ('max' in option && value > option.max) {
        throw new Error(path + ' must be at most ' + option.max);
      }
      return value;
    });
  };

  middleware.isIn = function (values) {
    return middleware.each(function (value, _ref10) {
      var path = _ref10.path;

      if (!values.includes(value)) throw new Error(path + ' has invalid value');
      return value;
    });
  };

  middleware.isLength = function (option) {
    return middleware.each(function (value, _ref11) {
      var path = _ref11.path;

      if ((0, _util.isString)(value)) {
        if ('min' in option && value.length < option.min) throw new Error(path + ' must be at least ' + option.min + ' characters long');
        if ('max' in option && value.length > option.max) throw new Error(path + ' must be at most ' + option.max + ' characters long');
        return value;
      }
      throw new Error(path + ' must be a string');
    });
  };

  middleware.matches = function (regex) {
    return middleware.each(function (value, _ref12) {
      var path = _ref12.path;

      if (regex.test(value)) return value;
      throw new Error(path + ' is not valid');
    });
  };
  return middleware;
};