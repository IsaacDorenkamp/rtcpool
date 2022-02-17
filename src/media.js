function valid_kind(kind) {
	if(![null, "video", "audio"].includes(kind)) {
		throw new Error(`Invalid track kind "${kind}"`);
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
class ManagedStream extends EventTarget {
	constructor(stream, pool) {
		super();
		this._streams = {};
		this._tracks = stream.getTracks();
		this._senders = {};
		this._pool = pool;

		const pruner = this._prune.bind(this);
		this._tracks.forEach(track => track.addEventListener("ended", pruner));

		for (const conn of this._pool.connections) {
			let cstream = new MediaStream();
			this._streams[conn.id] = cstream;
			for (const track of this._tracks) {
				this._senders[track.id] = conn.addTrack(track, cstream);
			}
		}

		this._bound_updater = this._update_peer.bind(this);

		this._pool.events.addEventListener("peer", this._bound_updater);
	}

	_prune() {
		this._tracks = this._tracks.filter(track => track.readyState !== "ended");
		if (this.closed) {
			this.dispatchEvent(new CustomEvent('close', {
				target: this
			}));
		}
	}

	_update_peer(event) {
		const conn = event.detail.connection;
		const cstream = new MediaStream();
		this._streams[conn.id] = cstream;
		for (const track of this._tracks) {
			this._senders[track.id] = event.detail.connection.addTrack(track, cstream);
		}
	}

	/**
	 * Close the media stream and prevent tracks from being sent to any other peers.
	 */
	close() {
		this._pool.events.removeEventListener("peer", this._bound_updater);
		for (const track of this._tracks) {
			track.stop();
		}
		this._tracks = [];
	}

	/**
	 * Mute all or some tracks in the stream.
	 * 
	 * If kind is null, all tracks will be muted.
	 * If kind is 'video' or 'audio', only tracks
	 * of the corresponding kind will be muted.
	 */
	mute(kind=null) {
		valid_kind(kind);
		let to_mute = this._tracks;
		if (kind) to_mute = to_mute.filter(track => track.kind === kind);
		to_mute.forEach(track => {
			track.enabled = false;
		});

		for (const conn of this._pool._raw_connections) {
			const senders = conn.getSenders();
			for (const track of to_mute) {
				const sender = this._senders[track.id];
				if (senders.includes(sender)) {
					conn.removeTrack(sender);
				}
			}
		}
	}

	/**
	 * Unmute all or some tracks in the stream.
	 * 
	 * If kind is null, all tracks will be unmuted.
	 * If kind is 'video' or 'audio', only tracks
	 * of the corresponding kind will be unmuted.
	 */
	unmute(kind=null) {
		valid_kind(kind);
		let to_unmute = this._tracks;
		if (kind) to_unmute = to_unmute.filter(track => track.kind === kind);
		to_unmute.forEach(track => {
			track.enabled = true;
		});

		for (const conn of this._pool._raw_connections) {
			const trans = conn.getTransceivers();
			for (const track of to_unmute) {
				const sender = trans.find(t => t.sender === this._senders[track.id]);
				this._senders[track.id].replaceTrack(track);
				sender.direction = "sendrecv";
			}
		}
	}

	/**
	 * Checks if a subset of tracks are muted. If kind is null, this checks if all tracks are muted.
	 * Otherwise, checks if all tracks of the specified kind ('video' or 'audio') are muted.
	 * 
	 * @return {Boolean} Whether the specified kind of track is muted (all tracks if kind is null).
	 */
	muted(kind=null) {
		valid_kind(kind);
		let check = this._tracks;
		if (kind) check = check.filter(track => track.kind === kind);
		return check.every(track => track.enabled);
	}

	/**
	 * Check if this ManagedStream has a MediaStream with the specified ID.
	 * 
	 * @param {string} The ID to check for.
	 * 
	 * @return {Boolean} true if the stream is found, false otherwise
	 */
	hasStream(id) {
		return Object.values(this._streams).some(stream => stream.id === id);
	}

	/**
	 * Get the MediaStream associated with the given connection ID.
	 * 
	 * @param {string} conn_id - The ID of the connection to get the MediaStream for.
	 * 
	 * @return {MediaStream} The MediaStream associated with the specified connection.
	 */
	getStream(conn_id) {
		return this._streams[conn_id];
	}

	/**
	 * Gets a connection by the ID of the MediaStream associated with it.
	 * 
	 * @param {string} stream_id - The stream to get the connection for.
	 * 
	 * @return {ManagedConnection} The associated connection.
	 */
	getConnection(stream_id) {
		for (const entry of Object.entries(this._streams)) {
			if (entry[1].id === stream_id) {
				return this._pool.getConnection(entry[0]);
			}
		}

		return null;
	}

	/**
	 * Whether this stream is closed.
	 * 
	 * @type {Boolean}
	 */
	get closed() {
		return this._tracks.length === 0;
	}

	/**
	 * List of tracks in this stream.
	 * 
	 * @type {array}
	 */
	get tracks() {
		return this._tracks.filter(e => true);
	}
};

module.exports = {
	"ManagedStream": ManagedStream
};