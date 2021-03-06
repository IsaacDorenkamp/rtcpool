/**
 * A class wrapping RTCPeerConnection
 * which exposes intuitive, high level
 * methods for interacting with the
 * connection while hiding the ICE
 * layer and negotiation-related aspects,
 * as these are handled entirely internally.
 */
class ManagedConnection {
	static EVENTS = ["datachannel", "track"];

	#conn;
	#id;
	#descriptions;

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
	constructor(conn, id, descs) {
		this.#conn = conn;
		this.#id = id;
		this.#descriptions = descs;
	}

	/**
	 * A proxy for adding listeners to the managed
	 * peer connection. Only permits exposed event
	 * types, as many events fired by RTCPeerConnection
	 * are purely used for negotiation and detecting
	 * negotiation success/failure.
	 */
	addEventListener(evt_type, ...args) {
		if (!ManagedConnection.EVENTS.includes(evt_type)) {
			throw new Error(`Event type '${evt_type}' is not handled by ManagedConnection.`);
		} else {
			this.#conn.addEventListener(evt_type, ...args)
		}
	}

	/**
	 * A proxy for removing listeners from the managed connection.
	 */
	removeEventListener(...args) {
		this.#conn.removeEventListener(...args);
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
	dataChannel(label, options={}, raw=false) {
		const channel = this.#conn.createDataChannel(label, options);
		if (raw) {
			return channel;
		} else {
			return new Promise(resolve => {
				channel.onopen = () => resolve(channel);
			});
		}
	}

	/**
	 * A proxy for RTCPeerConnection.addTrack
	 */
	addTrack(track, ...streams) {
		return this.#conn.addTrack(track, ...streams);
	}

	/**
	 * A proxy for RTCPeerConnection.removeTrack
	 */
	removeTrack(sender) {
		this.#conn.removeTrack(track);
	}

	/**
	 * The ID of the peer.
	 */
	get id() {
		return this.#id;
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
	get description() {
		return this.#descriptions[this.#id];
	}
}

module.exports = {
	'ManagedConnection': ManagedConnection
};