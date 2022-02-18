"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function proxied(arr, fnname) {
  return function () {
    var ret = [];

    var _iterator = _createForOfIteratorHelper(arr),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var item = _step.value;
        var fn = item[fnname].bind(item);
        ret.push(fn.apply(void 0, arguments));
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    return ret;
  };
}

function multiproxy(arr) {
  return new Proxy(arr, {
    get: function get(obj, prop, receiver) {
      if (obj.length === 0) return undefined;
      var all_fn = true;
      var ret = obj.map(function (item) {
        var attr = item[prop];

        if (typeof attr === 'function') {
          var res = attr.bind(item);
          return res;
        } else {
          all_fn = false;
          return attr;
        }
      });

      if (all_fn) {
        return function () {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          return ret.map(function (fn) {
            return fn.apply(void 0, args);
          });
        };
      } else {
        return ret;
      }
    },
    set: function set(obj, prop, val) {
      obj.forEach(function (item) {
        item[prop] = val;
      });
      return true;
    }
  });
}

function withattrs(obj, attrs) {
  return new Proxy(obj, {
    get: function get(inst, prop, receiver) {
      if (prop in attrs) {
        return attrs[prop];
      } else {
        var val = Reflect.get(inst, prop);

        if (typeof val === 'function') {
          return val.bind(inst);
        } else {
          return val;
        }
      }
    }
  });
}

function withon(evt_target, evt_types) {
  var transform_event = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

  // allow an EventTarget to also allow
  // target.onevent = handler
  var _iterator2 = _createForOfIteratorHelper(evt_types),
      _step2;

  try {
    var _loop = function _loop() {
      var evt_type = _step2.value;
      evt_target['on' + evt_type] = null;
      evt_target.addEventListener(evt_type, function (event) {
        var handler = evt_target['on' + evt_type];
        handler && handler(transform_event ? transform_event(event) : event);
      });
    };

    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      _loop();
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }

  return evt_target;
}

module.exports = {
  'multiproxy': multiproxy,
  'withattrs': withattrs,
  'withon': withon
};