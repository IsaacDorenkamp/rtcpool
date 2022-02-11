const util = require('./util');

/**
 * Represents a media stream broadcast to all peers.
 */
class RTCStream {

	/**
	 * Create an RTCStream.
	 * 
	 * @param {MediaStream} med_str - The MediaStream to broadcast.
	 */
	constructor(med_str) {
		if (!(med_str instanceof MediaStream)) {
			throw new TypeError("Must receive an instance of MediaStream!");
		}

		this._stream = med_str;

		this.onaddtrack = null;
		this.onremovetrack = null;

		this._stream.onaddtrack = evt => this.onaddtrack && this.onaddtrack(evt);
		this._stream.onremovetrack = evt => this.onremovetrack && this.onremovetrack(evt);

		this._senders = [];
		this._closed = false;
	}

	/**
	 * The array of ``MediaStreamTrack`` s in the stream.
	 * 
	 * @type {array}
	 */
	get tracks() {
		return this._stream.getTracks();
	}

	/**
	 * The underlying ``MediaStream`` that this class wraps.
	 * 
	 * @type {MediaStream}
	 */
	get raw() {
		return this._stream;
	}

	/**
	 * Applies this medium to a given connection. This is used internally
	 * by :class:`Pool` to automatically add media to peer connections when
	 * relevant. You do not need to call it yourself, and doing so may
	 * cause undefined behavior.
	 * 
	 * @param {RTCPeerConnection} rtc_conn - The connection to which to add the MediaStreamTracks.
	 */
	apply(rtc_conn) {
		for (const track of this.tracks) {
			this._senders.push([rtc_conn, rtc_conn.addTrack(track)]);
		}
	}

	/**
	 * Closes the media stream.
	 */
	close() {
		for (const sender of this._senders) {
			sender[1].track.stop();
			// sender[0].removeTrack(sender[1]);
		}
		this._closed = true;
	}

	/**
	 * Whether this RTCStream is closed.
	 * 
	 * @type {Boolean}
	 */
	get closed() {
		return this._closed;
	}

	/**
	 * Creates an RTC stream from a call to navigator.mediaDevices.getUserMedia.
	 * 
	 * @param {Object} constraints - The getUserMedia constrains defining the media to be gotten.
	 * @return {Promise<RTCStream>} An RTCStream wrapping the media returned by getUserMedia.
	 */
	static fromUserMedia(constraints) {
		return navigator.mediaDevices.getUserMedia(constraints).then(result => {
			return new RTCStream(result);	
		});
	}
}

/**
 * Represents a data channel broadcast to all peers.
 * 
 * To create individual channels between endpoints, see :meth:`Pool.dataChannel`
 */
class BroadcastDataChannel {

	static EVENTS = [ "bufferedamountlow", "close", "closing", "error", "message", "open" ];

	/**
	 * The interface for all events triggered a
	 * data channel managed by this class.
	 * 
	 * Manages all standard events for RTCDataChannel.
	 * 
	 * @type {EventTarget}
	 */
	events;

	/**
	 * Creates a BroadcastDataChannel with the given
	 * label and options.
	 * 
	 * @param {string} label - The label to be assigned to the data channels.
	 * @param {Object} options - The RTCDataChannel options to create channels with.
	 */
	constructor(label, options={}) {
		this._label = label;
		this._options = options;
		this._channels = [];
		this._closed = false;

		this.events = util.withon(new EventTarget(), BroadcastDataChannel.EVENTS);
		this._dispatch = (evt) => {
			const copied = new Event(evt.type, evt);
			this.events.dispatchEvent(copied);
		};
	}

	/**
	 * Close all data channels open, and mark this
	 * broadcast channel as closed.
	 */
	close() {
		for (const channel of this._channels) {
			channel.readyState === "open" && channel.close();
		}
		this._closed = true;
	}

	/**
	 * Send the provided data through all open channels.
	 */
	send(data) {
		for (const channel of this._channels) {
			channel.readyState === "open" && channel.send(data);
		}
	}

	/**
	 * Applies this medium to a given connection. This is used internally
	 * by :class:`Pool` to automatically add media to peer connections when
	 * relevant. You do not need to call it yourself, and doing so may
	 * cause undefined behavior.
	 * 
	 * @param {RTCPeerConnection} rtc_conn - The connection to create a data channel for.
	 */
	apply(rtc_conn) {
		const channel = rtc_conn.createDataChannel(this._label, this._options);
		channel.addEventListener('close', this._prune.bind(this));
		for (const event of BroadcastDataChannel.EVENTS) {
			channel.addEventListener(event, this._dispatch);
		}
		this._channels.push(channel);
	}

	_prune() {
		this._channels = this._channels.filter(channel => !['closing', 'closed'].includes(channel.readyState));
	}

	/**
	 * Whether this BroadcastDataChannel is closed.
	 * 
	 * @type {Boolean}
	 */
	get closed() {
		return this._closed;
	}
}

module.exports = {
	'RTCStream': RTCStream,
	'BroadcastDataChannel': BroadcastDataChannel
};