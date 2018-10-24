"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.transformationResult = exports.TransformationError = void 0;

var _util = require("./util");

var validators = _interopRequireWildcard(require("validator"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _construct(Parent, args, Class) { if (isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var isInt = validators.isInt,
    isFloat = validators.isFloat;

var TransformationError =
/*#__PURE__*/
function (_Error) {
  _inherits(TransformationError, _Error);

  function TransformationError() {
    var _this;

    _classCallCheck(this, TransformationError);

    {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      try {
        var _getPrototypeOf2;

        _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(TransformationError)).call.apply(_getPrototypeOf2, [this].concat(args)));
      } catch (err) {}

      _this.message = args[0];
    }
    return _this;
  }

  return TransformationError;
}(_wrapNativeSuper(Error));

exports.TransformationError = TransformationError;

var transformationResult = function transformationResult(req) {
  return req.__transformationErrors || [];
}; //NOTE: transformer ignore value that is not provided by default.
//Check their existence via .exists() or append {force: true} option in .transform(..)


exports.transformationResult = transformationResult;

var _default = function _default(path) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$location = _ref.location,
      location = _ref$location === void 0 ? 'body' : _ref$location,
      _ref$nonstop = _ref.nonstop,
      nonstop = _ref$nonstop === void 0 ? false : _ref$nonstop;

  var stack = [];

  var middleware =
  /*#__PURE__*/
  function () {
    var _ref2 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2(req, res, next) {
      var hasError, message, forcedMessage, appendError, fullpath, getValue, setValue, hasValue, doTransform, _i, _ref5, type, callback, force, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, p;

      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              hasError = transformationResult(req).length;
              message = null;
              forcedMessage = null;

              appendError = function appendError(error) {
                req.__transformationErrors = req.__transformationErrors || [];

                req.__transformationErrors.push({
                  location: location,
                  path: path,
                  error: error
                });
              };

              fullpath = function fullpath(p) {
                return "".concat(location, ".").concat(p);
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

              hasValue = function hasValue(inlinePath) {
                return Array.isArray(inlinePath) ? inlinePath.some(function (p) {
                  return (0, _util.recursiveHas)(req, fullpath(p));
                }) : (0, _util.recursiveHas)(req, fullpath(inlinePath));
              };

              doTransform =
              /*#__PURE__*/
              function () {
                var _ref3 = _asyncToGenerator(
                /*#__PURE__*/
                regeneratorRuntime.mark(function _callee(inlinePath, callback, force) {
                  var sanitized, err;
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          if (!(force || hasValue(inlinePath))) {
                            _context.next = 14;
                            break;
                          }

                          _context.prev = 1;
                          _context.next = 4;
                          return callback(getValue(inlinePath), {
                            req: req,
                            path: inlinePath,
                            location: location
                          });

                        case 4:
                          sanitized = _context.sent;
                          setValue(inlinePath, sanitized);
                          _context.next = 14;
                          break;

                        case 8:
                          _context.prev = 8;
                          _context.t0 = _context["catch"](1);
                          hasError = true;

                          if (!(_context.t0 instanceof TransformationError) && (message || forcedMessage)) {
                            err = new TransformationError(message || forcedMessage);
                          } else err = _context.t0;

                          appendError(err);
                          return _context.abrupt("return", true);

                        case 14:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee, this, [[1, 8]]);
                }));

                return function doTransform(_x4, _x5, _x6) {
                  return _ref3.apply(this, arguments);
                };
              }();

              _i = 0;

            case 11:
              if (!(_i < stack.length)) {
                _context2.next = 87;
                break;
              }

              _ref5 = stack[_i];
              type = _ref5.type, callback = _ref5.callback, force = _ref5.force;

              if (!(!nonstop && hasError)) {
                _context2.next = 16;
                break;
              }

              return _context2.abrupt("break", 87);

            case 16:
              _context2.t0 = type;
              _context2.next = _context2.t0 === 'every' ? 19 : _context2.t0 === 'transformer' ? 53 : _context2.t0 === 'message' ? 57 : 84;
              break;

            case 19:
              if (!Array.isArray(path)) {
                _context2.next = 53;
                break;
              }

              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context2.prev = 23;
              _iterator = path[Symbol.iterator]();

            case 25:
              if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                _context2.next = 37;
                break;
              }

              p = _step.value;
              _context2.t1 = !nonstop;

              if (!_context2.t1) {
                _context2.next = 32;
                break;
              }

              _context2.next = 31;
              return doTransform(p, callback, force);

            case 31:
              _context2.t1 = _context2.sent;

            case 32:
              if (!_context2.t1) {
                _context2.next = 34;
                break;
              }

              return _context2.abrupt("break", 37);

            case 34:
              _iteratorNormalCompletion = true;
              _context2.next = 25;
              break;

            case 37:
              _context2.next = 43;
              break;

            case 39:
              _context2.prev = 39;
              _context2.t2 = _context2["catch"](23);
              _didIteratorError = true;
              _iteratorError = _context2.t2;

            case 43:
              _context2.prev = 43;
              _context2.prev = 44;

              if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
              }

            case 46:
              _context2.prev = 46;

              if (!_didIteratorError) {
                _context2.next = 49;
                break;
              }

              throw _iteratorError;

            case 49:
              return _context2.finish(46);

            case 50:
              return _context2.finish(43);

            case 51:
              message = null;
              return _context2.abrupt("break", 84);

            case 53:
              _context2.next = 55;
              return doTransform(path, callback, force);

            case 55:
              message = null;
              return _context2.abrupt("break", 84);

            case 57:
              _context2.prev = 57;

              if (!force) {
                _context2.next = 69;
                break;
              }

              if (!(0, _util.isString)(callback)) {
                _context2.next = 63;
                break;
              }

              _context2.t3 = callback;
              _context2.next = 66;
              break;

            case 63:
              _context2.next = 65;
              return callback(getValue(), {
                req: req
              });

            case 65:
              _context2.t3 = _context2.sent;

            case 66:
              forcedMessage = _context2.t3;
              _context2.next = 77;
              break;

            case 69:
              if (!(0, _util.isString)(callback)) {
                _context2.next = 73;
                break;
              }

              _context2.t4 = callback;
              _context2.next = 76;
              break;

            case 73:
              _context2.next = 75;
              return callback(getValue(), {
                req: req
              });

            case 75:
              _context2.t4 = _context2.sent;

            case 76:
              message = _context2.t4;

            case 77:
              _context2.next = 83;
              break;

            case 79:
              _context2.prev = 79;
              _context2.t5 = _context2["catch"](57);
              hasError = true;
              appendError(_context2.t5);

            case 83:
              return _context2.abrupt("break", 84);

            case 84:
              _i++;
              _context2.next = 11;
              break;

            case 87:
              next();
              _context2.next = 93;
              break;

            case 90:
              _context2.prev = 90;
              _context2.t6 = _context2["catch"](0);
              next(_context2.t6);

            case 93:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[0, 90], [23, 39, 43, 51], [44,, 46, 50], [57, 79]]);
    }));

    return function middleware(_x, _x2, _x3) {
      return _ref2.apply(this, arguments);
    };
  }();

  middleware.transform = function (callback) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    stack.push(_objectSpread({}, options, {
      type: 'transformer',
      callback: callback
    }));
    return middleware;
  };

  middleware.message = function (callback) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    stack.push(_objectSpread({}, options, {
      type: 'message',
      callback: callback
    }));
    return middleware;
  };

  middleware.every = middleware.each = function (callback) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    stack.push(_objectSpread({}, options, {
      type: 'every',
      callback: callback
    }));
    return middleware;
  };

  middleware.exists = function () {
    var _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref6$acceptEmptyStri = _ref6.acceptEmptyString,
        acceptEmptyString = _ref6$acceptEmptyStri === void 0 ? false : _ref6$acceptEmptyStri;

    return middleware.each(function (value, _ref7) {
      var path = _ref7.path;
      if (value === undefined || !acceptEmptyString && value === '' || value === null) throw new Error("".concat(path, " is required"));
      return value;
    }, {
      force: true
    });
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
    }, {
      force: true
    });
  }; // All value checked by validator's function need to be string type


  var _arr = Object.entries(validators);

  var _loop = function _loop() {
    var _arr$_i = _slicedToArray(_arr[_i2], 2),
        vKey = _arr$_i[0],
        vCallback = _arr$_i[1];

    if (vKey.startsWith('is')) middleware[vKey] = function () {
      for (var _len2 = arguments.length, options = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        options[_key2] = arguments[_key2];
      }

      return middleware.each(function (value, _ref13) {
        var path = _ref13.path;
        if (!(0, _util.isString)(value)) throw new Error("".concat(path, " must be a string"));
        if (!vCallback.apply(void 0, [value].concat(options))) throw new Error("".concat(path, " is not a valid ").concat(value.slice(2)));
        return value;
      });
    };else if (vKey.startsWith('to')) middleware[vKey] = function () {
      for (var _len3 = arguments.length, options = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        options[_key3] = arguments[_key3];
      }

      return middleware.each(function (value, _ref14) {
        var path = _ref14.path;
        if (!(0, _util.isString)(value)) throw new Error("".concat(path, " must be a string"));
        return vCallback.apply(void 0, [value].concat(options));
      });
    };
  };

  for (var _i2 = 0; _i2 < _arr.length; _i2++) {
    _loop();
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
      if (error) throw new Error("".concat(path, " must be an integer"));
      if ('min' in option && value < option.min) throw new Error("".concat(path, " must be at least ").concat(option.min));
      if ('max' in option && value > option.max) throw new Error("".concat(path, " must be at most ").concat(option.max));
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

      if (error) throw new Error("".concat(path, " must be a number"));
      if ('min' in option && value < option.min) throw new Error("".concat(path, " must be at least ").concat(option.min));

      if ('max' in option && value > option.max) {
        throw new Error("".concat(path, " must be at most ").concat(option.max));
      }

      return value;
    });
  };

  middleware.isIn = function (values) {
    return middleware.each(function (value, _ref10) {
      var path = _ref10.path;
      if (!values.includes(value)) throw new Error("".concat(path, " has invalid value"));
      return value;
    });
  };

  middleware.isLength = function (option) {
    var number = parseFloat(option);

    if (!isNaN(number)) {
      option = {
        min: number,
        max: number
      };
    }

    return middleware.each(function (value, _ref11) {
      var path = _ref11.path;

      if ((0, _util.isString)(value) || Array.isArray(value)) {
        if (option.hasOwnProperty('min') && value.length < option.min) throw new Error("".concat(path, " must have at least ").concat(option.min, " length"));
        if (option.hasOwnProperty('max') && value.length > option.max) throw new Error("".concat(path, " must have at most ").concat(option.max, " length"));
        return value;
      }

      throw new Error("".concat(path, " must be a string or an array"));
    });
  };

  middleware.matches = function (regex) {
    return middleware.each(function (value, _ref12) {
      var path = _ref12.path;
      if (regex.test(value)) return value;
      throw new Error("".concat(path, " is not valid"));
    });
  };

  return middleware;
};

exports.default = _default;