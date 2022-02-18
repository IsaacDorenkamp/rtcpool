"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _wrapNativeSuper2 = _interopRequireDefault(require("@babel/runtime/helpers/wrapNativeSuper"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var listeners = {
  'rtc:joined': 'join',
  'rtc:describe': 'describe',
  'rtc:peer': 'peer',
  'rtc:sdp': 'sdp',
  'rtc:close': 'close',
  'rtc:candidate': 'icecandidate',
  'rtc:stop': 'stop'
};
/**
 * Base class for transceivers.
 */

var transceiver = /*#__PURE__*/function (_EventTarget) {
  (0, _inherits2["default"])(transceiver, _EventTarget);

  var _super = _createSuper(transceiver);

  function transceiver() {
    (0, _classCallCheck2["default"])(this, transceiver);
    return _super.call(this);
  }
  /**
   * Sends a message with the given
   * type and data.
   * 
   * @abstract
   * @param {string} msg_type - The message type.
   * @param {Object} msg_data - The message data.
   */


  (0, _createClass2["default"])(transceiver, [{
    key: "send",
    value: function send(msg_type, msg_data) {
      throw new Error("Not Implemented");
    }
    /**
     * Closes the transceiver.
     * 
     * @abstract
     */

  }, {
    key: "close",
    value: function close() {
      throw new Error("Not Implemented");
    }
  }]);
  return transceiver;
}( /*#__PURE__*/(0, _wrapNativeSuper2["default"])(EventTarget));
/**
 * socket.io transceiver class.
 */


var sio_transceiver = /*#__PURE__*/function (_transceiver) {
  (0, _inherits2["default"])(sio_transceiver, _transceiver);

  var _super2 = _createSuper(sio_transceiver);

  /**
   * Create a socket.io transceiver.
   * 
   * @params {Object} - The connection
   *   returned by io() on the socket.io
   *   client.
   */
  function sio_transceiver(sockio) {
    var _this;

    (0, _classCallCheck2["default"])(this, sio_transceiver);
    _this = _super2.call(this);
    _this.socket = sockio;

    _this.socket.onAny(function (event, data) {
      _this.dispatchEvent(new CustomEvent(event, {
        'detail': data
      }));
    });

    return _this;
  }
  /**
   * 
   */


  (0, _createClass2["default"])(sio_transceiver, [{
    key: "send",
    value: function send(msg_type, data) {
      this.socket.emit(msg_type, data);
    }
  }, {
    key: "close",
    value: function close() {
      this.socket.close();
    }
  }]);
  return sio_transceiver;
}(transceiver);
/**
 * 
 */


var websocket_transceiver = /*#__PURE__*/function (_transceiver2) {
  (0, _inherits2["default"])(websocket_transceiver, _transceiver2);

  var _super3 = _createSuper(websocket_transceiver);

  function websocket_transceiver(websocket) {
    var _this2;

    (0, _classCallCheck2["default"])(this, websocket_transceiver);
    _this2 = _super3.call(this);
    _this2._buffer = [];
    _this2.socket = websocket;

    _this2.socket.addEventListener('open', function () {
      var _iterator = _createForOfIteratorHelper(_this2._buffer),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var message = _step.value;

          _this2.socket.send(message);

          delete _this2._buffer;
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    });

    _this2.socket.addEventListener('message', function (evt) {
      try {
        var data = JSON.parse(evt.data);
        var evt_type = data.type;
        var evt_data = data.data;

        if (!(typeof evt_type === "string" && evt_data instanceof Object)) {
          throw new Error();
        }

        _this2.dispatchEvent(new CustomEvent(evt_type, {
          'detail': evt_data
        }));
      } catch (e) {
        _this2.dispatchEvent(new CustomEvent('error', {
          detail: {
            'message': 'Server sent invalid signalling message',
            'data': evt.data
          }
        }));
      }
    });

    return _this2;
  }

  (0, _createClass2["default"])(websocket_transceiver, [{
    key: "send",
    value: function send(msg_type, data) {
      var message = JSON.stringify({
        'type': msg_type,
        'data': data
      });

      if (this.socket.readyState === 0) {
        // still connecting, buffer messages
        this._buffer.push(message);
      } else if (this.socket.readyState === 1) {
        // socket is open
        this.socket.send(message);
      } else {
        throw new Error("WebSocket is CLOSED or CLOSING.");
      }
    }
  }, {
    key: "close",
    value: function close() {
      this.socket.close();
    }
  }]);
  return websocket_transceiver;
}(transceiver);
/**
 * Represents a signalling channel
 * through which RTC negotiations occur.
 */


var signalling = /*#__PURE__*/function (_EventTarget2) {
  (0, _inherits2["default"])(signalling, _EventTarget2);

  var _super4 = _createSuper(signalling);

  /**
   * Create a signalling channel that translates
   * raw events to signalling-friendly events
   * and sends messages during RTC negotiation.
   * 
   * @param {Object} transceiver - An object that extends EventTarget,
   *   and receives signalling messages from the server which it dispatches
   *   as events to itself.
   */
  function signalling(transceiver) {
    var _this3;

    (0, _classCallCheck2["default"])(this, signalling);
    _this3 = _super4.call(this);
    _this3.transceiver = transceiver;

    for (var _i = 0, _Object$keys = Object.keys(listeners); _i < _Object$keys.length; _i++) {
      var src_event = _Object$keys[_i];

      _this3.transceiver.addEventListener(src_event, _this3._dispatch(listeners[src_event]));
    }

    return _this3;
  }

  (0, _createClass2["default"])(signalling, [{
    key: "send",
    value: function send(msg_type, data) {
      this.transceiver.send(msg_type, data);
    }
  }, {
    key: "close",
    value: function close() {
      this.transceiver.close();
    }
  }, {
    key: "_dispatch",
    value: function _dispatch(evt_name) {
      return function (evt) {
        this.dispatchEvent(new CustomEvent(evt_name, evt));
      }.bind(this);
    }
  }]);
  return signalling;
}( /*#__PURE__*/(0, _wrapNativeSuper2["default"])(EventTarget));
/**
 * socket.io signalling class.
 */


var socketio = /*#__PURE__*/function (_signalling) {
  (0, _inherits2["default"])(socketio, _signalling);

  var _super5 = _createSuper(socketio);

  /**
   * Create a socketio signalling channel.
   * 
   * @param {Object} io - The connection returned by io()
   */
  function socketio(io) {
    (0, _classCallCheck2["default"])(this, socketio);
    return _super5.call(this, new sio_transceiver(io));
  }

  return (0, _createClass2["default"])(socketio);
}(signalling);
/**
 * Raw WebSocket signalling channel.
 */


var websocket = /*#__PURE__*/function (_signalling2) {
  (0, _inherits2["default"])(websocket, _signalling2);

  var _super6 = _createSuper(websocket);

  /**
   * Create a raw WebSocket signalling channel.
   * 
   * @param {WebSocket} socket - A WebSocket.
   */
  function websocket(socket) {
    (0, _classCallCheck2["default"])(this, websocket);
    return _super6.call(this, new websocket_transceiver(socket));
  }

  return (0, _createClass2["default"])(websocket);
}(signalling);

signalling['socket'] = {
  'io': socketio
};
signalling['websocket'] = websocket;
module.exports = signalling;