"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.transformationResult = exports.errorKey = exports.TransformationError = void 0;

var _util = require("./util");

var validators = _interopRequireWildcard(require("validator"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

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
var errorKey = '__transformationErrors';
exports.errorKey = errorKey;

var transformationResult = function transformationResult(req) {
  return req[errorKey] || [];
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
    regeneratorRuntime.mark(function _callee4(req, res, next) {
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.prev = 0;
              return _context4.delegateYield(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee3() {
                var hasError, message, forcedMessage, appendError, fullPath, doSubtransform, doTransform, _i2, _ref8, type, callback, force, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, p, values;

                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        hasError = transformationResult(req).length;
                        message = null;
                        forcedMessage = null;

                        appendError = function appendError(error) {
                          req[errorKey] = req[errorKey] || [];
                          req[errorKey].push({
                            location: location,
                            path: path,
                            error: error
                          });
                        };

                        fullPath = function fullPath(p) {
                          return [location, p].join('.');
                        };
                        /**
                         *
                         * @param prefix Prefix added so far
                         * @param firstArray currently processing array prefix
                         * @param arrays remaining array prefixes
                         * @param inlinePath last path
                         * @param callback
                         * @param force
                         * @returns {Promise<void>}
                         */


                        doSubtransform =
                        /*#__PURE__*/
                        function () {
                          var _ref4 = _asyncToGenerator(
                          /*#__PURE__*/
                          regeneratorRuntime.mark(function _callee(prefix, _ref3, inlinePath, callback, force) {
                            var _ref5, firstArray, arrays, processArray, values, i, _values, _i, p, value, sanitized, _value, _sanitized;

                            return regeneratorRuntime.wrap(function _callee$(_context) {
                              while (1) {
                                switch (_context.prev = _context.next) {
                                  case 0:
                                    _ref5 = _toArray(_ref3), firstArray = _ref5[0], arrays = _ref5.slice(1);

                                    processArray = function processArray(p) {
                                      //force only effective when value does not exist
                                      if (!(0, _util.recursiveHas)(req, fullPath(p)) && !force) return [];
                                      var values = (0, _util.recursiveGet)(req, fullPath(p)); //always reset existing value regardless force's value

                                      if (!Array.isArray(values)) {
                                        values = [];
                                        (0, _util.recursiveSet)(req, fullPath(p), []);
                                      }

                                      return values;
                                    };

                                    if (!firstArray) {
                                      _context.next = 14;
                                      break;
                                    }

                                    prefix = _toConsumableArray(prefix).concat([firstArray]);
                                    values = processArray(prefix.join('.'));
                                    i = 0;

                                  case 6:
                                    if (!(i < values.length)) {
                                      _context.next = 12;
                                      break;
                                    }

                                    _context.next = 9;
                                    return doSubtransform(_toConsumableArray(prefix).concat([i]), arrays, inlinePath, callback, force);

                                  case 9:
                                    i++;
                                    _context.next = 6;
                                    break;

                                  case 12:
                                    _context.next = 37;
                                    break;

                                  case 14:
                                    if (!/\[]$/.test(inlinePath)) {
                                      _context.next = 30;
                                      break;
                                    }

                                    inlinePath = _toConsumableArray(prefix).concat([inlinePath.slice(0, inlinePath.length - 2)]).join('.');
                                    _values = processArray(inlinePath);
                                    _i = 0;

                                  case 18:
                                    if (!(_i < _values.length)) {
                                      _context.next = 28;
                                      break;
                                    }

                                    p = [inlinePath, _i].join('.');
                                    value = (0, _util.recursiveGet)(req, fullPath(p));
                                    _context.next = 23;
                                    return callback(value, {
                                      location: location,
                                      path: p,
                                      req: req
                                    });

                                  case 23:
                                    sanitized = _context.sent;
                                    (0, _util.recursiveSet)(req, fullPath(p), sanitized);

                                  case 25:
                                    _i++;
                                    _context.next = 18;
                                    break;

                                  case 28:
                                    _context.next = 37;
                                    break;

                                  case 30:
                                    inlinePath = _toConsumableArray(prefix).concat([inlinePath]).join('.');

                                    if (!(force || (0, _util.recursiveHas)(req, fullPath(inlinePath)))) {
                                      _context.next = 37;
                                      break;
                                    }

                                    _value = (0, _util.recursiveGet)(req, fullPath(inlinePath));
                                    _context.next = 35;
                                    return callback(_value, {
                                      location: location,
                                      path: inlinePath,
                                      req: req
                                    });

                                  case 35:
                                    _sanitized = _context.sent;
                                    (0, _util.recursiveSet)(req, fullPath(inlinePath), _sanitized);

                                  case 37:
                                  case "end":
                                    return _context.stop();
                                }
                              }
                            }, _callee, this);
                          }));

                          return function doSubtransform(_x4, _x5, _x6, _x7, _x8) {
                            return _ref4.apply(this, arguments);
                          };
                        }(); //return positive if error


                        doTransform =
                        /*#__PURE__*/
                        function () {
                          var _ref6 = _asyncToGenerator(
                          /*#__PURE__*/
                          regeneratorRuntime.mark(function _callee2(inlinePath, callback, force) {
                            var arraySplits, values, sanitized, err;
                            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                              while (1) {
                                switch (_context2.prev = _context2.next) {
                                  case 0:
                                    _context2.prev = 0;

                                    if (Array.isArray(inlinePath)) {
                                      _context2.next = 7;
                                      break;
                                    }

                                    arraySplits = inlinePath.split(/\[]\./);
                                    _context2.next = 5;
                                    return doSubtransform([], arraySplits.slice(0, arraySplits.length - 1), arraySplits[arraySplits.length - 1], callback, force);

                                  case 5:
                                    _context2.next = 13;
                                    break;

                                  case 7:
                                    if (!(force || inlinePath.some(function (p) {
                                      return (0, _util.recursiveHas)(req, fullPath(p));
                                    }))) {
                                      _context2.next = 13;
                                      break;
                                    }

                                    values = inlinePath.map(function (p) {
                                      return (0, _util.recursiveGet)(req, fullPath(p));
                                    });
                                    _context2.next = 11;
                                    return callback(values, {
                                      req: req,
                                      path: inlinePath,
                                      location: location
                                    });

                                  case 11:
                                    sanitized = _context2.sent;
                                    inlinePath.forEach(function (p, i) {
                                      return (0, _util.recursiveSet)(req, fullPath(p), sanitized === null || sanitized === void 0 ? void 0 : sanitized[i]);
                                    });

                                  case 13:
                                    _context2.next = 21;
                                    break;

                                  case 15:
                                    _context2.prev = 15;
                                    _context2.t0 = _context2["catch"](0);
                                    hasError = true;

                                    if (!(_context2.t0 instanceof TransformationError) && (message || forcedMessage)) {
                                      err = new TransformationError(message || forcedMessage);
                                    } else err = _context2.t0;

                                    appendError(err);
                                    return _context2.abrupt("return", true);

                                  case 21:
                                  case "end":
                                    return _context2.stop();
                                }
                              }
                            }, _callee2, this, [[0, 15]]);
                          }));

                          return function doTransform(_x9, _x10, _x11) {
                            return _ref6.apply(this, arguments);
                          };
                        }();

                        _i2 = 0;

                      case 8:
                        if (!(_i2 < stack.length)) {
                          _context3.next = 85;
                          break;
                        }

                        _ref8 = stack[_i2];
                        type = _ref8.type, callback = _ref8.callback, force = _ref8.force;

                        if (!(!nonstop && hasError)) {
                          _context3.next = 13;
                          break;
                        }

                        return _context3.abrupt("break", 85);

                      case 13:
                        _context3.t0 = type;
                        _context3.next = _context3.t0 === 'every' ? 16 : _context3.t0 === 'transformer' ? 50 : _context3.t0 === 'message' ? 54 : 82;
                        break;

                      case 16:
                        if (!Array.isArray(path)) {
                          _context3.next = 50;
                          break;
                        }

                        _iteratorNormalCompletion = true;
                        _didIteratorError = false;
                        _iteratorError = undefined;
                        _context3.prev = 20;
                        _iterator = path[Symbol.iterator]();

                      case 22:
                        if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                          _context3.next = 34;
                          break;
                        }

                        p = _step.value;
                        _context3.t1 = !nonstop;

                        if (!_context3.t1) {
                          _context3.next = 29;
                          break;
                        }

                        _context3.next = 28;
                        return doTransform(p, callback, force);

                      case 28:
                        _context3.t1 = _context3.sent;

                      case 29:
                        if (!_context3.t1) {
                          _context3.next = 31;
                          break;
                        }

                        return _context3.abrupt("break", 34);

                      case 31:
                        _iteratorNormalCompletion = true;
                        _context3.next = 22;
                        break;

                      case 34:
                        _context3.next = 40;
                        break;

                      case 36:
                        _context3.prev = 36;
                        _context3.t2 = _context3["catch"](20);
                        _didIteratorError = true;
                        _iteratorError = _context3.t2;

                      case 40:
                        _context3.prev = 40;
                        _context3.prev = 41;

                        if (!_iteratorNormalCompletion && _iterator.return != null) {
                          _iterator.return();
                        }

                      case 43:
                        _context3.prev = 43;

                        if (!_didIteratorError) {
                          _context3.next = 46;
                          break;
                        }

                        throw _iteratorError;

                      case 46:
                        return _context3.finish(43);

                      case 47:
                        return _context3.finish(40);

                      case 48:
                        message = null;
                        return _context3.abrupt("break", 82);

                      case 50:
                        _context3.next = 52;
                        return doTransform(path, callback, force);

                      case 52:
                        message = null;
                        return _context3.abrupt("break", 82);

                      case 54:
                        _context3.prev = 54;
                        values = Array.isArray(path) ? path.map(function (p) {
                          return (0, _util.recursiveGet)(req, fullPath(p));
                        }) : (0, _util.recursiveGet)(req, fullPath(path));

                        if (!force) {
                          _context3.next = 67;
                          break;
                        }

                        if (!(0, _util.isString)(callback)) {
                          _context3.next = 61;
                          break;
                        }

                        _context3.t3 = callback;
                        _context3.next = 64;
                        break;

                      case 61:
                        _context3.next = 63;
                        return callback(values, {
                          req: req,
                          path: path,
                          location: location
                        });

                      case 63:
                        _context3.t3 = _context3.sent;

                      case 64:
                        forcedMessage = _context3.t3;
                        _context3.next = 75;
                        break;

                      case 67:
                        if (!(0, _util.isString)(callback)) {
                          _context3.next = 71;
                          break;
                        }

                        _context3.t4 = callback;
                        _context3.next = 74;
                        break;

                      case 71:
                        _context3.next = 73;
                        return callback(values, {
                          req: req,
                          path: path,
                          location: location
                        });

                      case 73:
                        _context3.t4 = _context3.sent;

                      case 74:
                        message = _context3.t4;

                      case 75:
                        _context3.next = 81;
                        break;

                      case 77:
                        _context3.prev = 77;
                        _context3.t5 = _context3["catch"](54);
                        hasError = true;
                        appendError(_context3.t5);

                      case 81:
                        return _context3.abrupt("break", 82);

                      case 82:
                        _i2++;
                        _context3.next = 8;
                        break;

                      case 85:
                        next();

                      case 86:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee3, this, [[20, 36, 40, 48], [41,, 43, 47], [54, 77]]);
              })(), "t0", 2);

            case 2:
              _context4.next = 7;
              break;

            case 4:
              _context4.prev = 4;
              _context4.t1 = _context4["catch"](0);
              next(_context4.t1);

            case 7:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this, [[0, 4]]);
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
    var _ref9 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref9$acceptEmptyStri = _ref9.acceptEmptyString,
        acceptEmptyString = _ref9$acceptEmptyStri === void 0 ? false : _ref9$acceptEmptyStri;

    return middleware.each(function (value, _ref10) {
      var path = _ref10.path;
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
    var _arr$_i = _slicedToArray(_arr[_i3], 2),
        vKey = _arr$_i[0],
        vCallback = _arr$_i[1];

    if (vKey.startsWith('is')) middleware[vKey] = function () {
      for (var _len2 = arguments.length, options = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        options[_key2] = arguments[_key2];
      }

      return middleware.each(function (value, _ref16) {
        var path = _ref16.path;
        if (!(0, _util.isString)(value)) throw new Error("".concat(path, " must be a string"));
        if (!vCallback.apply(void 0, [value].concat(options))) throw new Error("".concat(path, " is not a valid ").concat(value.slice(2)));
        return value;
      });
    };else if (vKey.startsWith('to')) middleware[vKey] = function () {
      for (var _len3 = arguments.length, options = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        options[_key3] = arguments[_key3];
      }

      return middleware.each(function (value, _ref17) {
        var path = _ref17.path;
        if (!(0, _util.isString)(value)) throw new Error("".concat(path, " must be a string"));
        return vCallback.apply(void 0, [value].concat(options));
      });
    };
  };

  for (var _i3 = 0; _i3 < _arr.length; _i3++) {
    _loop();
  }

  middleware.toInt = function () {
    var option = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return middleware.each(function (value, _ref11) {
      var path = _ref11.path;
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
    return middleware.each(function (value, _ref12) {
      var path = _ref12.path;
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
    return middleware.each(function (value, _ref13) {
      var path = _ref13.path;
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

    return middleware.each(function (value, _ref14) {
      var path = _ref14.path;

      if ((0, _util.isString)(value) || Array.isArray(value)) {
        if (option.hasOwnProperty('min') && value.length < option.min) throw new Error("".concat(path, " must have at least ").concat(option.min, " length"));
        if (option.hasOwnProperty('max') && value.length > option.max) throw new Error("".concat(path, " must have at most ").concat(option.max, " length"));
        return value;
      }

      throw new Error("".concat(path, " must be a string or an array"));
    });
  };

  middleware.matches = function (regex) {
    return middleware.each(function (value, _ref15) {
      var path = _ref15.path;
      if (regex.test(value)) return value;
      throw new Error("".concat(path, " is not valid"));
    });
  };

  return middleware;
};

exports.default = _default;