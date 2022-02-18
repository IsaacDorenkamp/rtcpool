const util = require('./util');
const media = require('./media');
const { ManagedConnection } = require('./connection');

/**
 * A pool of WebRTC connections. All negotiations
 * are handled internally, and while RTCPeerConnections
 * can be directly accessed by connection ID, this
 * class has sufficient functionality to manage media
 * and data channels without directly interacting with them.
 */
class Pool {
	static SIGNAL_EVENTS = ["join", "request", "describe", "sdp", "close", "icecandidate", "stop", "peer"];

	/**
	 * The interface for all events triggered by connections.
	 * The events which are exposed and dispatched to this
	 * EventTarget are 'join', 'close', and 'describe.'
	 * 
	 * @type {EventTarget}
	 */
	events;

	#config;
	#signals;

	#connections;
	#descriptions;

	#id;
	#joining;

	/**
	 * Create an RTC pool from a TURN/STUN config and a signaller.
	 * 
	 * @param {Object} base_config - The TURN/STUN configuration.
	 * @param {signalling} signaller - The :class:`signalling` channel.
	 */
	constructor(base_config, signaller) {
		this.#config = base_config;
		this.#signals = util.withon(
			signaller,
			Pool.SIGNAL_EVENTS,
			evt => evt.detail
		);

		this.#connections = {};
		this.#descriptions = {};

		this.#id = null;
		this.#joining = false;

		this.#signals.onpeer = this.#onpeer.bind(this);
		this.#signals.onsdp = this.#onsdp.bind(this);
		this.#signals.onclose = this.#onclose.bind(this);
		this.#signals.onicecandidate = this.#onicecandidate.bind(this);
		this.#signals.onjoin = this.#onjoin.bind(this);
		this.#signals.onstop = this.close.bind(this, 'stop');
		this.#signals.ondescribe = this.#describe.bind(this);

		this.events = util.withon(new EventTarget(), ['join', 'stop', 'close', 'describe', 'peer']);
	}

	/**
	 * Sends a 'join' message to the signalling server to join a pool.
	 * This method will not throw an exception, but if this endpoint is
	 * already part of one, the signalling server will return an error.
	 * 
	 * @param {string} pool - The ID of the pool to join.
	 */
	join(pool) {
		if (this.#id || this.#joining) throw new Error("Cannot join a pool: already joining or joined.");

		this.#joining = true;
		this.#signals.send('rtc:join', {
			'pool': pool
		});
	}

	#describe(data) {
		const conn_id = data.id;
		const conn = this.#connections[conn_id].managed;
		this.#descriptions[conn_id] = data.description;
		this.events.dispatchEvent(new CustomEvent('describe', {
			detail: {
				connection: conn,
				description: data.description
			}
		}));
	}

	/**
	 * Closes all connections, as well as the signalling channel.
	 * Causes a 'close' event to be dispatched to {this.events}
	 */
	close(evt_type='close') {
		for (const state of Object.values(this.#connections)) {
			state.raw.close();
		}
		this.#signals.close();
		this.#connections = {};
		this.events.dispatchEvent(new CustomEvent(evt_type, {
			'detail': null
		}))
	}

	#create_pc(id) {
		const conn = new RTCPeerConnection(this.#config);
		const managed = new ManagedConnection(conn, id, this.#descriptions);
		conn.addEventListener('icecandidate', (evt) => this.#signals.send('rtc:candidate', {
			'from': this.#id,
			'for': id,
			'candidate': evt.candidate
		}));
		conn.addEventListener('iceconnectionstatechange', (evt) => {
			switch(conn.iceConnectionState) {
			case "failed":
				conn.restartIce();
				break;
			case "closed":
			case "disconnected":
				if (this.#retains(id)) {
					this.events.dispatchEvent(new CustomEvent('close', {
						'detail': managed
					}));
				}
			default:
				break;
			}
		});
		conn.addEventListener('negotiationneeded', this.#negotiate.bind(this, id));

		for (const evt of ManagedConnection.EVENTS) {
			conn.addEventListener(evt, this.#dispatch.bind(this, id));
		}

		this.#connections[id] = {
			raw: conn,
			managed: managed,
			polite: false,
			busy: false,
			ignore: false,
			answering: false
		};
		this.#descriptions[id] = null;

		// Good to dispatch before whatever happens next,
		// especially if adding media in listener(s)
		this.events.dispatchEvent(new CustomEvent('peer', {
			detail: {
				connection: managed
			}
		}));

		return conn;
	}

	#dispatch(id, evt) {
		const new_evt = new evt.constructor(evt.type, evt);
		new_evt.connection = id;
		this.events.dispatchEvent(new_evt);
	}

	#get_or_create(id) {
		if (this.#retains(id)) {
			return this.#connections[id].raw;
		} else {
			const conn = this.#create_pc(id);
			return conn;
		}
	}

	#retains(id) {
		return Object.keys(this.#connections).includes(id);
	}

	#onjoin(data) {
		this.#id = data.client_id;
		this.#joining = false;
		for (const peer of data.peers) {
			const desc = (data.descriptions || {})[peer] || null;
			this.#create_pc(peer);
			this.#descriptions[peer] = desc;
			this.#connections[peer].polite = true; // We joined after them, so we must be polite
		}
		this.events.dispatchEvent(new Event('join'));
	}

	#onpeer(data) {
		const target = data.id;
		const conn = this.#create_pc(target);
		this.#connections[target].polite = false;
	}

	#onclose(close_req) {
		const conn = this.#connections[close_req.id];
		conn.raw.close();
		this.events.dispatchEvent(new CustomEvent('close', {
			'detail': conn.managed
		}));

		delete this.#connections[close_req.id];
		delete this.#descriptions[close_req.id];
	}

	async #onicecandidate(data) {
		const state = this.#connections[data.from];
		const conn = state.raw;
		try {
			await conn.addIceCandidate(data.candidate);
		} catch(e) {
			if (!state.ignore) throw e;
		}
	}

	async #negotiate(id) {
		const state = this.#connections[id];
		const conn = state.raw; 
		state.busy = true;
		await conn.setLocalDescription();
		this.#signals.send("rtc:sdp", {
			"to": id,
			"description": conn.localDescription
		});
		state.busy = false;
	}


	async #onsdp(data) {
		const state = this.#connections[data.peer];
		const conn = state.raw;

		const desc = data.description;
		const acceptOffer = !state.busy && (conn.signalingState === "stable" || state.answering);
		state.ignore = !acceptOffer && desc.type === "offer";

		if(state.ignore && !state.polite) return;

		state.answering = desc.type === "answer";
		await conn.setRemoteDescription(desc);
		state.answering = false;
		if (desc.type === "offer") {
			await conn.setLocalDescription();
			this.#signals.send('rtc:sdp', {
				'to': data.peer,
				'description': conn.localDescription
			});
		}
	}

	/**
	 * Gets the RTCPeerConnection associated with the specified endpoint.
	 * 
	 * @param {string} id - The ID of the endpoint connection to get.
	 * @return {ManagedConnection | null} The :class:`ManagedConnection` to the desired
	 *         endpoint, or null if it does not exist.
	 */
	getConnection(id) {
		const state = this.#connections[id];
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
	get id() {
		return this.#id;
	}

	/**
	 * A list of every :class:`ManagedConnection`.
	 * 
	 * @type {array}
	 */
	get connections() {
		return Object.values(this.#connections).map(state => state.managed);
	}

	get _raw_connections() {
		return Object.values(this.#connections).map(state => state.raw);
	}

	/**
	 * The number of connections open.
	 * 
	 * @type {number}
	 */
	get nconnections() {
		return Object.keys(this.#connections).length;
	}
};

module.exports = {
	'Pool': Pool
};