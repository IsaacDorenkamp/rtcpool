"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classPrivateFieldGet2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldGet"));

var _classPrivateFieldSet2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldSet"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }

function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }

function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }

function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }

var util = require('./util');

var media = require('./media');

var _require = require('./connection'),
    ManagedConnection = _require.ManagedConnection;
/**
 * A pool of WebRTC connections. All negotiations
 * are handled internally, and while RTCPeerConnections
 * can be directly accessed by connection ID, this
 * class has sufficient functionality to manage media
 * and data channels without directly interacting with them.
 */


var _config = /*#__PURE__*/new WeakMap();

var _signals = /*#__PURE__*/new WeakMap();

var _connections = /*#__PURE__*/new WeakMap();

var _descriptions = /*#__PURE__*/new WeakMap();

var _id = /*#__PURE__*/new WeakMap();

var _joining = /*#__PURE__*/new WeakMap();

var _describe = /*#__PURE__*/new WeakSet();

var _create_pc = /*#__PURE__*/new WeakSet();

var _dispatch = /*#__PURE__*/new WeakSet();

var _get_or_create = /*#__PURE__*/new WeakSet();

var _retains = /*#__PURE__*/new WeakSet();

var _onjoin = /*#__PURE__*/new WeakSet();

var _onpeer = /*#__PURE__*/new WeakSet();

var _onclose = /*#__PURE__*/new WeakSet();

var _onicecandidate = /*#__PURE__*/new WeakSet();

var _negotiate = /*#__PURE__*/new WeakSet();

var _onsdp = /*#__PURE__*/new WeakSet();

var Pool = /*#__PURE__*/function () {
  /**
   * The interface for all events triggered by connections.
   * The events which are exposed and dispatched to this
   * EventTarget are 'join', 'close', and 'describe.'
   * 
   * @type {EventTarget}
   */

  /**
   * Create an RTC pool from a TURN/STUN config and a signaller.
   * 
   * @param {Object} base_config - The TURN/STUN configuration.
   * @param {signalling} signaller - The :class:`signalling` channel.
   */
  function Pool(base_config, signaller) {
    (0, _classCallCheck2["default"])(this, Pool);

    _classPrivateMethodInitSpec(this, _onsdp);

    _classPrivateMethodInitSpec(this, _negotiate);

    _classPrivateMethodInitSpec(this, _onicecandidate);

    _classPrivateMethodInitSpec(this, _onclose);

    _classPrivateMethodInitSpec(this, _onpeer);

    _classPrivateMethodInitSpec(this, _onjoin);

    _classPrivateMethodInitSpec(this, _retains);

    _classPrivateMethodInitSpec(this, _get_or_create);

    _classPrivateMethodInitSpec(this, _dispatch);

    _classPrivateMethodInitSpec(this, _create_pc);

    _classPrivateMethodInitSpec(this, _describe);

    (0, _defineProperty2["default"])(this, "events", void 0);

    _classPrivateFieldInitSpec(this, _config, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _signals, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _connections, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _descriptions, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _id, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _joining, {
      writable: true,
      value: void 0
    });

    (0, _classPrivateFieldSet2["default"])(this, _config, base_config);
    (0, _classPrivateFieldSet2["default"])(this, _signals, util.withon(signaller, Pool.SIGNAL_EVENTS, function (evt) {
      return evt.detail;
    }));
    (0, _classPrivateFieldSet2["default"])(this, _connections, {});
    (0, _classPrivateFieldSet2["default"])(this, _descriptions, {});
    (0, _classPrivateFieldSet2["default"])(this, _id, null);
    (0, _classPrivateFieldSet2["default"])(this, _joining, false);
    (0, _classPrivateFieldGet2["default"])(this, _signals).onpeer = _classPrivateMethodGet(this, _onpeer, _onpeer2).bind(this);
    (0, _classPrivateFieldGet2["default"])(this, _signals).onsdp = _classPrivateMethodGet(this, _onsdp, _onsdp2).bind(this);
    (0, _classPrivateFieldGet2["default"])(this, _signals).onclose = _classPrivateMethodGet(this, _onclose, _onclose2).bind(this);
    (0, _classPrivateFieldGet2["default"])(this, _signals).onicecandidate = _classPrivateMethodGet(this, _onicecandidate, _onicecandidate2).bind(this);
    (0, _classPrivateFieldGet2["default"])(this, _signals).onjoin = _classPrivateMethodGet(this, _onjoin, _onjoin2).bind(this);
    (0, _classPrivateFieldGet2["default"])(this, _signals).onstop = this.close.bind(this, 'stop');
    (0, _classPrivateFieldGet2["default"])(this, _signals).ondescribe = _classPrivateMethodGet(this, _describe, _describe2).bind(this);
    this.events = util.withon(new EventTarget(), ['join', 'stop', 'close', 'describe', 'peer']);
  }
  /**
   * Sends a 'join' message to the signalling server to join a pool.
   * This method will not throw an exception, but if this endpoint is
   * already part of one, the signalling server will return an error.
   * 
   * @param {string} pool - The ID of the pool to join.
   */


  (0, _createClass2["default"])(Pool, [{
    key: "join",
    value: function join(pool) {
      if ((0, _classPrivateFieldGet2["default"])(this, _id) || (0, _classPrivateFieldGet2["default"])(this, _joining)) throw new Error("Cannot join a pool: already joining or joined.");
      (0, _classPrivateFieldSet2["default"])(this, _joining, true);
      (0, _classPrivateFieldGet2["default"])(this, _signals).send('rtc:join', {
        'pool': pool
      });
    }
  }, {
    key: "close",
    value:
    /**
     * Closes all connections, as well as the signalling channel.
     * Causes a 'close' event to be dispatched to {this.events}
     */
    function close() {
      var evt_type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'close';

      for (var _i = 0, _Object$values = Object.values((0, _classPrivateFieldGet2["default"])(this, _connections)); _i < _Object$values.length; _i++) {
        var state = _Object$values[_i];
        state.raw.close();
      }

      (0, _classPrivateFieldGet2["default"])(this, _signals).close();
      (0, _classPrivateFieldSet2["default"])(this, _connections, {});
      this.events.dispatchEvent(new CustomEvent(evt_type, {
        'detail': null
      }));
    }
  }, {
    key: "getConnection",
    value:
    /**
     * Gets the RTCPeerConnection associated with the specified endpoint.
     * 
     * @param {string} id - The ID of the endpoint connection to get.
     * @return {ManagedConnection | null} The :class:`ManagedConnection` to the desired
     *         endpoint, or null if it does not exist.
     */
    function getConnection(id) {
      var state = (0, _classPrivateFieldGet2["default"])(this, _connections)[id];

      if (state) {
        return state.managed;
      } else {
        return null;
      }
    }
    /**
     * The ID of this endpoint. Will be null if no pool has been joined successfully.
     * 
     * @type {string}
     */

  }, {
    key: "id",
    get: function get() {
      return (0, _classPrivateFieldGet2["default"])(this, _id);
    }
    /**
     * A list of every :class:`ManagedConnection`.
     * 
     * @type {array}
     */

  }, {
    key: "connections",
    get: function get() {
      return Object.values((0, _classPrivateFieldGet2["default"])(this, _connections)).map(function (state) {
        return state.managed;
      });
    }
  }, {
    key: "_raw_connections",
    get: function get() {
      return Object.values((0, _classPrivateFieldGet2["default"])(this, _connections)).map(function (state) {
        return state.raw;
      });
    }
    /**
     * The number of connections open.
     * 
     * @type {number}
     */

  }, {
    key: "nconnections",
    get: function get() {
      return Object.keys((0, _classPrivateFieldGet2["default"])(this, _connections)).length;
    }
  }]);
  return Pool;
}();

function _describe2(data) {
  var conn_id = data.id;
  var conn = (0, _classPrivateFieldGet2["default"])(this, _connections)[conn_id].managed;
  (0, _classPrivateFieldGet2["default"])(this, _descriptions)[conn_id] = data.description;
  this.events.dispatchEvent(new CustomEvent('describe', {
    detail: {
      connection: conn,
      description: data.description
    }
  }));
}

function _create_pc2(id) {
  var _this = this;

  var conn = new RTCPeerConnection((0, _classPrivateFieldGet2["default"])(this, _config));
  var managed = new ManagedConnection(conn, id, (0, _classPrivateFieldGet2["default"])(this, _descriptions));
  conn.addEventListener('icecandidate', function (evt) {
    return (0, _classPrivateFieldGet2["default"])(_this, _signals).send('rtc:candidate', {
      'from': (0, _classPrivateFieldGet2["default"])(_this, _id),
      'for': id,
      'candidate': evt.candidate
    });
  });
  conn.addEventListener('iceconnectionstatechange', function (evt) {
    switch (conn.iceConnectionState) {
      case "failed":
        conn.restartIce();
        break;

      case "closed":
      case "disconnected":
        if (_classPrivateMethodGet(_this, _retains, _retains2).call(_this, id)) {
          _this.events.dispatchEvent(new CustomEvent('close', {
            'detail': managed
          }));
        }

      default:
        break;
    }
  });
  conn.addEventListener('negotiationneeded', _classPrivateMethodGet(this, _negotiate, _negotiate2).bind(this, id));

  var _iterator = _createForOfIteratorHelper(ManagedConnection.EVENTS),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var evt = _step.value;
      conn.addEventListener(evt, _classPrivateMethodGet(this, _dispatch, _dispatch2).bind(this, id));
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  (0, _classPrivateFieldGet2["default"])(this, _connections)[id] = {
    raw: conn,
    managed: managed,
    polite: false,
    busy: false,
    ignore: false,
    answering: false
  };
  (0, _classPrivateFieldGet2["default"])(this, _descriptions)[id] = null; // Good to dispatch before whatever happens next,
  // especially if adding media in listener(s)

  this.events.dispatchEvent(new CustomEvent('peer', {
    detail: {
      connection: managed
    }
  }));
  return conn;
}

function _dispatch2(id, evt) {
  var new_evt = new evt.constructor(evt.type, evt);
  new_evt.connection = id;
  this.events.dispatchEvent(new_evt);
}

function _get_or_create2(id) {
  if (_classPrivateMethodGet(this, _retains, _retains2).call(this, id)) {
    return (0, _classPrivateFieldGet2["default"])(this, _connections)[id].raw;
  } else {
    var conn = _classPrivateMethodGet(this, _create_pc, _create_pc2).call(this, id);

    return conn;
  }
}

function _retains2(id) {
  return Object.keys((0, _classPrivateFieldGet2["default"])(this, _connections)).includes(id);
}

function _onjoin2(data) {
  (0, _classPrivateFieldSet2["default"])(this, _id, data.client_id);
  (0, _classPrivateFieldSet2["default"])(this, _joining, false);

  var _iterator2 = _createForOfIteratorHelper(data.peers),
      _step2;

  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var peer = _step2.value;
      var desc = (data.descriptions || {})[peer] || null;

      _classPrivateMethodGet(this, _create_pc, _create_pc2).call(this, peer);

      (0, _classPrivateFieldGet2["default"])(this, _descriptions)[peer] = desc;
      (0, _classPrivateFieldGet2["default"])(this, _connections)[peer].polite = true; // We joined after them, so we must be polite
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }

  this.events.dispatchEvent(new Event('join'));
}

function _onpeer2(data) {
  var target = data.id;

  var conn = _classPrivateMethodGet(this, _create_pc, _create_pc2).call(this, target);

  (0, _classPrivateFieldGet2["default"])(this, _connections)[target].polite = false;
}

function _onclose2(close_req) {
  var conn = (0, _classPrivateFieldGet2["default"])(this, _connections)[close_req.id];
  conn.raw.close();
  this.events.dispatchEvent(new CustomEvent('close', {
    'detail': conn.managed
  }));
  delete (0, _classPrivateFieldGet2["default"])(this, _connections)[close_req.id];
  delete (0, _classPrivateFieldGet2["default"])(this, _descriptions)[close_req.id];
}

function _onicecandidate2(_x) {
  return _onicecandidate3.apply(this, arguments);
}

function _onicecandidate3() {
  _onicecandidate3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(data) {
    var state, conn;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            state = (0, _classPrivateFieldGet2["default"])(this, _connections)[data.from];
            conn = state.raw;
            _context.prev = 2;
            _context.next = 5;
            return conn.addIceCandidate(data.candidate);

          case 5:
            _context.next = 11;
            break;

          case 7:
            _context.prev = 7;
            _context.t0 = _context["catch"](2);

            if (state.ignore) {
              _context.next = 11;
              break;
            }

            throw _context.t0;

          case 11:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this, [[2, 7]]);
  }));
  return _onicecandidate3.apply(this, arguments);
}

function _negotiate2(_x2) {
  return _negotiate3.apply(this, arguments);
}

function _negotiate3() {
  _negotiate3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(id) {
    var state, conn;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            state = (0, _classPrivateFieldGet2["default"])(this, _connections)[id];
            conn = state.raw;
            state.busy = true;
            _context2.next = 5;
            return conn.setLocalDescription();

          case 5:
            (0, _classPrivateFieldGet2["default"])(this, _signals).send("rtc:sdp", {
              "to": id,
              "description": conn.localDescription
            });
            state.busy = false;

          case 7:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return _negotiate3.apply(this, arguments);
}

function _onsdp2(_x3) {
  return _onsdp3.apply(this, arguments);
}

function _onsdp3() {
  _onsdp3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(data) {
    var state, conn, desc, acceptOffer;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            state = (0, _classPrivateFieldGet2["default"])(this, _connections)[data.peer];
            conn = state.raw;
            desc = data.description;
            acceptOffer = !state.busy && (conn.signalingState === "stable" || state.answering);
            state.ignore = !acceptOffer && desc.type === "offer";

            if (!(state.ignore && !state.polite)) {
              _context3.next = 7;
              break;
            }

            return _context3.abrupt("return");

          case 7:
            state.answering = desc.type === "answer";
            _context3.next = 10;
            return conn.setRemoteDescription(desc);

          case 10:
            state.answering = false;

            if (!(desc.type === "offer")) {
              _context3.next = 15;
              break;
            }

            _context3.next = 14;
            return conn.setLocalDescription();

          case 14:
            (0, _classPrivateFieldGet2["default"])(this, _signals).send('rtc:sdp', {
              'to': data.peer,
              'description': conn.localDescription
            });

          case 15:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return _onsdp3.apply(this, arguments);
}

(0, _defineProperty2["default"])(Pool, "SIGNAL_EVENTS", ["join", "request", "describe", "sdp", "close", "icecandidate", "stop", "peer"]);
;
module.exports = {
  'Pool': Pool
};