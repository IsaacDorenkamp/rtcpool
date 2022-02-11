const listeners = {
	'rtc:joined': 'join',
	'rtc:describe': 'describe',
	'rtc:request_offers': 'request',
	'rtc:offer': 'offer',
	'rtc:answer': 'answer',
	'rtc:close': 'close',
	'rtc:candidate': 'icecandidate',
	'rtc:stop': 'stop'
};

/**
 * Base class for transceivers.
 */
class transceiver extends EventTarget {
	constructor() {
		super();
	}

	/**
	 * Sends a message with the given
	 * type and data.
	 * 
	 * @abstract
	 * @param {string} msg_type - The message type.
	 * @param {Object} msg_data - The message data.
	 */
	send(msg_type, msg_data) {
		throw new Error("Not Implemented");
	}

	/**
	 * Closes the transceiver.
	 * 
	 * @abstract
	 */
	close() {
		throw new Error("Not Implemented");
	}
}

/**
 * socket.io transceiver class.
 */
class sio_transceiver extends transceiver {

	/**
	 * Create a socket.io transceiver.
	 * 
	 * @params {Object} - The connection
	 *   returned by io() on the socket.io
	 *   client.
	 */
	constructor(sockio) {
		super();
		this.socket = sockio;
		this.socket.onAny((event, data) => {
			this.dispatchEvent(new CustomEvent(event, {
				'detail': data
			}));
		});
	}

	/**
	 * 
	 */
	send(msg_type, data) {
		this.socket.emit(msg_type, data);
	}

	close() {
		this.socket.close();
	}
}

/**
 * 
 */
class websocket_transceiver extends transceiver {
	constructor(websocket) {
		super();
		this._buffer = [];
		this.socket = websocket;
		this.socket.addEventListener('open', () => {
			for (const message of this._buffer) {
				this.socket.send(message);
				delete this._buffer;
			}
		});
		this.socket.addEventListener('message', (evt) => {
			try {
				const data = JSON.parse(evt.data);
				const evt_type = data.type;
				const evt_data = data.data;
				if (!(typeof evt_type === "string" && evt_data instanceof Object)) {
					throw new Error();
				}

				this.dispatchEvent(new CustomEvent(evt_type, {
					'detail': evt_data
				}));
			} catch(e) {
				this.dispatchEvent(new CustomEvent('error', {
					detail: {
						'message': 'Server sent invalid signalling message',
						'data': evt.data
					}
				}));
			}
		});
	}

	send(msg_type, data) {
		const message = JSON.stringify({
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

	close() {
		this.socket.close();
	}
}

/**
 * Represents a signalling channel
 * through which RTC negotiations occur.
 */
class signalling extends EventTarget {

	/**
	 * Create a signalling channel that translates
	 * raw events to signalling-friendly events
	 * and sends messages during RTC negotiation.
	 * 
	 * @param {Object} transceiver - An object that extends EventTarget,
	 *   and receives signalling messages from the server which it dispatches
	 *   as events to itself.
	 */
	constructor(transceiver) {
		super();
		this.transceiver = transceiver;

		for (const src_event of Object.keys(listeners)) {
			this.transceiver.addEventListener(src_event, this._dispatch(listeners[src_event]));
		}
	}

	send(msg_type, data) {
		this.transceiver.send(msg_type, data);
	}

	close() {
		this.transceiver.close();
	}

	_dispatch(evt_name) {
		return function(evt) {
			this.dispatchEvent(new CustomEvent(evt_name, evt));
		}.bind(this);
	}
}

/**
 * socket.io signalling class.
 */
class socketio extends signalling {
	/**
	 * Create a socketio signalling channel.
	 * 
	 * @param {Object} io - The connection returned by io()
	 */
	constructor(io) {
		super(new sio_transceiver(io));
	}
}

/**
 * Raw WebSocket signalling channel.
 */
class websocket extends signalling {
	/**
	 * Create a raw WebSocket signalling channel.
	 * 
	 * @param {WebSocket} socket - A WebSocket.
	 */
	constructor(socket) {
		super(new websocket_transceiver(socket));
	}
}

signalling['socket'] = { 'io': socketio };
signalling['websocket'] = websocket;

module.exports = signalling;