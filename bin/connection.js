"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classPrivateFieldGet5 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldGet"));

var _classPrivateFieldSet2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldSet"));

function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }

function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }

var _conn = /*#__PURE__*/new WeakMap();

var _id = /*#__PURE__*/new WeakMap();

var _descriptions = /*#__PURE__*/new WeakMap();

/**
 * A class wrapping RTCPeerConnection
 * which exposes intuitive, high level
 * methods for interacting with the
 * connection while hiding the ICE
 * layer and negotiation-related aspects,
 * as these are handled entirely internally.
 */
var ManagedConnection = /*#__PURE__*/function () {
  /**
   * Creates a ManagedConnection
   * for the given RTCPeerConnection.
   * 
   * .. note::
   *		This is used internally by Pool to
   *		setup connections. There should
   *		be no need to call this in your code.
   * 
   * @param {RTCPeerConnection} conn - The RTCPeerConnection to wrap
   * @param {UUID} id - The unique ID of the connection in the pool
   * @param {Object} desc_ref - A reference to the Object containing
   *   the connection's description.
   */
  function ManagedConnection(conn, id, descs) {
    (0, _classCallCheck2["default"])(this, ManagedConnection);

    _classPrivateFieldInitSpec(this, _conn, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _id, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _descriptions, {
      writable: true,
      value: void 0
    });

    (0, _classPrivateFieldSet2["default"])(this, _conn, conn);
    (0, _classPrivateFieldSet2["default"])(this, _id, id);
    (0, _classPrivateFieldSet2["default"])(this, _descriptions, descs);
  }
  /**
   * A proxy for adding listeners to the managed
   * peer connection. Only permits exposed event
   * types, as many events fired by RTCPeerConnection
   * are purely used for negotiation and detecting
   * negotiation success/failure.
   */


  (0, _createClass2["default"])(ManagedConnection, [{
    key: "addEventListener",
    value: function addEventListener(evt_type) {
      if (!ManagedConnection.EVENTS.includes(evt_type)) {
        throw new Error("Event type '".concat(evt_type, "' is not handled by ManagedConnection."));
      } else {
        var _classPrivateFieldGet2;

        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        (_classPrivateFieldGet2 = (0, _classPrivateFieldGet5["default"])(this, _conn)).addEventListener.apply(_classPrivateFieldGet2, [evt_type].concat(args));
      }
    }
    /**
     * A proxy for removing listeners from the managed connection.
     */

  }, {
    key: "removeEventListener",
    value: function removeEventListener() {
      var _classPrivateFieldGet3;

      (_classPrivateFieldGet3 = (0, _classPrivateFieldGet5["default"])(this, _conn)).removeEventListener.apply(_classPrivateFieldGet3, arguments);
    }
    /**
     * Create a data channel with the given label and options.
     * 
     * If raw is true, the channel will be returned immediately,
     * without waiting for the channel to open.
     * 
     * If raw is false, returns a Promise that resolves to
     * the channel when the channel has opened.
     * 
     * @param {string} label - The label of the data channel.
     * @param {Object} options - The options to use to create the data channel.
     * @param {Boolean} raw - Whether to return the channel immediately or return a Promise.
     * 
     * @return {Promise<RTCDataChannel> | RTCDataChannel} A promise resolving to the created channel, or the channel itself.
     */

  }, {
    key: "dataChannel",
    value: function dataChannel(label) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var raw = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var channel = (0, _classPrivateFieldGet5["default"])(this, _conn).createDataChannel(label, options);

      if (raw) {
        return channel;
      } else {
        return new Promise(function (resolve) {
          channel.onopen = function () {
            return resolve(channel);
          };
        });
      }
    }
    /**
     * A proxy for RTCPeerConnection.addTrack
     */

  }, {
    key: "addTrack",
    value: function addTrack(track) {
      var _classPrivateFieldGet4;

      for (var _len2 = arguments.length, streams = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        streams[_key2 - 1] = arguments[_key2];
      }

      return (_classPrivateFieldGet4 = (0, _classPrivateFieldGet5["default"])(this, _conn)).addTrack.apply(_classPrivateFieldGet4, [track].concat(streams));
    }
    /**
     * A proxy for RTCPeerConnection.removeTrack
     */

  }, {
    key: "removeTrack",
    value: function removeTrack(sender) {
      (0, _classPrivateFieldGet5["default"])(this, _conn).removeTrack(track);
    }
    /**
     * The ID of the peer.
     */

  }, {
    key: "id",
    get: function get() {
      return (0, _classPrivateFieldGet5["default"])(this, _id);
    }
    /**
     * The description of the peer.
     * 
     * This object should not be modified, as this
     * can produce unpredictable results and goes
     * against the spirit of descriptions.
     * 
     * @type {Object}
     */

  }, {
    key: "description",
    get: function get() {
      return (0, _classPrivateFieldGet5["default"])(this, _descriptions)[(0, _classPrivateFieldGet5["default"])(this, _id)];
    }
  }]);
  return ManagedConnection;
}();

(0, _defineProperty2["default"])(ManagedConnection, "EVENTS", ["datachannel", "track"]);
module.exports = {
  'ManagedConnection': ManagedConnection
};