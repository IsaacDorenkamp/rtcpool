"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _wrapNativeSuper2 = _interopRequireDefault(require("@babel/runtime/helpers/wrapNativeSuper"));

var _classPrivateFieldGet2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldGet"));

var _classPrivateFieldSet2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldSet"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }

function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }

function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }

function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }

function valid_kind(kind) {
  if (![null, "video", "audio"].includes(kind)) {
    throw new Error("Invalid track kind \"".concat(kind, "\""));
  }
}
/**
 * A class that automatically manages a
 * MediaStream, adding its tracks to all
 * existing peers and all peers that connect
 * later on. This behavior will continue
 * until this ManagedStream is closed or all
 * tracks have ended.
 */


var _streams = /*#__PURE__*/new WeakMap();

var _tracks = /*#__PURE__*/new WeakMap();

var _senders = /*#__PURE__*/new WeakMap();

var _pool = /*#__PURE__*/new WeakMap();

var _bound_updater = /*#__PURE__*/new WeakMap();

var _prune = /*#__PURE__*/new WeakSet();

var _update_peer = /*#__PURE__*/new WeakSet();

var ManagedStream = /*#__PURE__*/function (_EventTarget) {
  (0, _inherits2["default"])(ManagedStream, _EventTarget);

  var _super = _createSuper(ManagedStream);

  function ManagedStream(stream, pool) {
    var _this;

    (0, _classCallCheck2["default"])(this, ManagedStream);
    _this = _super.call(this);

    _classPrivateMethodInitSpec((0, _assertThisInitialized2["default"])(_this), _update_peer);

    _classPrivateMethodInitSpec((0, _assertThisInitialized2["default"])(_this), _prune);

    _classPrivateFieldInitSpec((0, _assertThisInitialized2["default"])(_this), _streams, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec((0, _assertThisInitialized2["default"])(_this), _tracks, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec((0, _assertThisInitialized2["default"])(_this), _senders, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec((0, _assertThisInitialized2["default"])(_this), _pool, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec((0, _assertThisInitialized2["default"])(_this), _bound_updater, {
      writable: true,
      value: void 0
    });

    (0, _classPrivateFieldSet2["default"])((0, _assertThisInitialized2["default"])(_this), _streams, {});
    (0, _classPrivateFieldSet2["default"])((0, _assertThisInitialized2["default"])(_this), _tracks, stream.getTracks());
    (0, _classPrivateFieldSet2["default"])((0, _assertThisInitialized2["default"])(_this), _senders, {});
    (0, _classPrivateFieldSet2["default"])((0, _assertThisInitialized2["default"])(_this), _pool, pool);

    var pruner = _classPrivateMethodGet((0, _assertThisInitialized2["default"])(_this), _prune, _prune2).bind((0, _assertThisInitialized2["default"])(_this));

    (0, _classPrivateFieldGet2["default"])((0, _assertThisInitialized2["default"])(_this), _tracks).forEach(function (track) {
      return track.addEventListener("ended", pruner);
    });

    var _iterator = _createForOfIteratorHelper((0, _classPrivateFieldGet2["default"])((0, _assertThisInitialized2["default"])(_this), _pool).connections),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var conn = _step.value;
        var cstream = new MediaStream();
        (0, _classPrivateFieldGet2["default"])((0, _assertThisInitialized2["default"])(_this), _streams)[conn.id] = cstream;

        var _iterator2 = _createForOfIteratorHelper((0, _classPrivateFieldGet2["default"])((0, _assertThisInitialized2["default"])(_this), _tracks)),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var track = _step2.value;
            (0, _classPrivateFieldGet2["default"])((0, _assertThisInitialized2["default"])(_this), _senders)[track.id] = conn.addTrack(track, cstream);
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    (0, _classPrivateFieldSet2["default"])((0, _assertThisInitialized2["default"])(_this), _bound_updater, _classPrivateMethodGet((0, _assertThisInitialized2["default"])(_this), _update_peer, _update_peer2).bind((0, _assertThisInitialized2["default"])(_this)));
    (0, _classPrivateFieldGet2["default"])((0, _assertThisInitialized2["default"])(_this), _pool).events.addEventListener("peer", (0, _classPrivateFieldGet2["default"])((0, _assertThisInitialized2["default"])(_this), _bound_updater));
    return _this;
  }

  (0, _createClass2["default"])(ManagedStream, [{
    key: "close",
    value:
    /**
     * Close the media stream and prevent tracks from being sent to any other peers.
     */
    function close() {
      (0, _classPrivateFieldGet2["default"])(this, _pool).events.removeEventListener("peer", (0, _classPrivateFieldGet2["default"])(this, _bound_updater));

      var _iterator3 = _createForOfIteratorHelper((0, _classPrivateFieldGet2["default"])(this, _tracks)),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var track = _step3.value;
          track.stop();
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }

      (0, _classPrivateFieldSet2["default"])(this, _tracks, []);
    }
    /**
     * Mute all or some tracks in the stream.
     * 
     * If kind is null, all tracks will be muted.
     * If kind is 'video' or 'audio', only tracks
     * of the corresponding kind will be muted.
     * 
     * @param {string} kind - The kind of track to mute.
     */

  }, {
    key: "mute",
    value: function mute() {
      var kind = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      valid_kind(kind);
      var to_mute = (0, _classPrivateFieldGet2["default"])(this, _tracks);
      if (kind) to_mute = to_mute.filter(function (track) {
        return track.kind === kind;
      });
      to_mute.forEach(function (track) {
        track.enabled = false;
      });

      var _iterator4 = _createForOfIteratorHelper((0, _classPrivateFieldGet2["default"])(this, _pool)._raw_connections),
          _step4;

      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var conn = _step4.value;
          var senders = conn.getSenders();

          var _iterator5 = _createForOfIteratorHelper(to_mute),
              _step5;

          try {
            for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
              var track = _step5.value;
              var sender = (0, _classPrivateFieldGet2["default"])(this, _senders)[track.id];

              if (senders.includes(sender)) {
                conn.removeTrack(sender);
              }
            }
          } catch (err) {
            _iterator5.e(err);
          } finally {
            _iterator5.f();
          }
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    }
    /**
     * Unmute all or some tracks in the stream.
     * 
     * If kind is null, all tracks will be unmuted.
     * If kind is 'video' or 'audio', only tracks
     * of the corresponding kind will be unmuted.
     * 
     * @param {string} kind - The kind of track to unmute.
     */

  }, {
    key: "unmute",
    value: function unmute() {
      var _this2 = this;

      var kind = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      valid_kind(kind);
      var to_unmute = (0, _classPrivateFieldGet2["default"])(this, _tracks);
      if (kind) to_unmute = to_unmute.filter(function (track) {
        return track.kind === kind;
      });
      to_unmute.forEach(function (track) {
        track.enabled = true;
      });

      var _iterator6 = _createForOfIteratorHelper((0, _classPrivateFieldGet2["default"])(this, _pool)._raw_connections),
          _step6;

      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var conn = _step6.value;
          var trans = conn.getTransceivers();

          var _iterator7 = _createForOfIteratorHelper(to_unmute),
              _step7;

          try {
            var _loop = function _loop() {
              var track = _step7.value;
              var sender = trans.find(function (t) {
                return t.sender === (0, _classPrivateFieldGet2["default"])(_this2, _senders)[track.id];
              });
              (0, _classPrivateFieldGet2["default"])(_this2, _senders)[track.id].replaceTrack(track);
              sender.direction = "sendrecv";
            };

            for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
              _loop();
            }
          } catch (err) {
            _iterator7.e(err);
          } finally {
            _iterator7.f();
          }
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
    }
    /**
     * Checks if a subset of tracks are muted. If kind is null, this checks if all tracks are muted.
     * Otherwise, checks if all tracks of the specified kind ('video' or 'audio') are muted.
     * 
     * @param {string} kind - The kind of track to check the muted state of.
     * 
     * @return {Boolean} Whether the specified kind of track is muted (all tracks if kind is null).
     */

  }, {
    key: "muted",
    value: function muted() {
      var kind = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      valid_kind(kind);
      var check = (0, _classPrivateFieldGet2["default"])(this, _tracks);
      if (kind) check = check.filter(function (track) {
        return track.kind === kind;
      });
      return check.every(function (track) {
        return track.enabled;
      });
    }
    /**
     * Check if this ManagedStream has a MediaStream with the specified ID.
     * 
     * @param {string} id - The ID to check for.
     * 
     * @return {Boolean} true if the stream is found, false otherwise
     */

  }, {
    key: "hasStream",
    value: function hasStream(id) {
      return Object.values((0, _classPrivateFieldGet2["default"])(this, _streams)).some(function (stream) {
        return stream.id === id;
      });
    }
    /**
     * Get the MediaStream associated with the given connection ID.
     * 
     * @param {string} conn_id - The ID of the connection to get the MediaStream for.
     * 
     * @return {MediaStream} The MediaStream associated with the specified connection.
     */

  }, {
    key: "getStream",
    value: function getStream(conn_id) {
      return (0, _classPrivateFieldGet2["default"])(this, _streams)[conn_id];
    }
    /**
     * Gets a connection by the ID of the MediaStream associated with it.
     * 
     * @param {string} stream_id - The stream to get the connection for.
     * 
     * @return {ManagedConnection} The associated connection.
     */

  }, {
    key: "getConnection",
    value: function getConnection(stream_id) {
      for (var _i = 0, _Object$entries = Object.entries((0, _classPrivateFieldGet2["default"])(this, _streams)); _i < _Object$entries.length; _i++) {
        var entry = _Object$entries[_i];

        if (entry[1].id === stream_id) {
          return (0, _classPrivateFieldGet2["default"])(this, _pool).getConnection(entry[0]);
        }
      }

      return null;
    }
    /**
     * Whether this stream is closed.
     * 
     * @type {Boolean}
     */

  }, {
    key: "closed",
    get: function get() {
      return (0, _classPrivateFieldGet2["default"])(this, _tracks).length === 0;
    }
    /**
     * List of tracks in this stream.
     * 
     * @type {array}
     */

  }, {
    key: "tracks",
    get: function get() {
      return (0, _classPrivateFieldGet2["default"])(this, _tracks).filter(function (e) {
        return true;
      });
    }
  }]);
  return ManagedStream;
}( /*#__PURE__*/(0, _wrapNativeSuper2["default"])(EventTarget));

function _prune2() {
  (0, _classPrivateFieldSet2["default"])(this, _tracks, (0, _classPrivateFieldGet2["default"])(this, _tracks).filter(function (track) {
    return track.readyState !== "ended";
  }));

  if (this.closed) {
    this.dispatchEvent(new CustomEvent('close', {
      target: this
    }));
  }
}

function _update_peer2(event) {
  var conn = event.detail.connection;
  var cstream = new MediaStream();
  (0, _classPrivateFieldGet2["default"])(this, _streams)[conn.id] = cstream;

  var _iterator8 = _createForOfIteratorHelper((0, _classPrivateFieldGet2["default"])(this, _tracks)),
      _step8;

  try {
    for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
      var track = _step8.value;
      (0, _classPrivateFieldGet2["default"])(this, _senders)[track.id] = event.detail.connection.addTrack(track, cstream);
    }
  } catch (err) {
    _iterator8.e(err);
  } finally {
    _iterator8.f();
  }
}

;
module.exports = {
  "ManagedStream": ManagedStream
};