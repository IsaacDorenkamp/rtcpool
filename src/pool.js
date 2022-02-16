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
	static EVENTS = ["connectionstatechange", "datachannel", "icecandidate", "icecandidateerror",
		"iceconnectionstatechange", "icegatheringstatechange", "negotiationneeded", "signalingstatechange", "track"];

	static SIGNAL_EVENTS = ["join", "request", "describe", "offer", "answer", "close", "icecandidate", "stop"];

	/**
	 * The interface for all events triggered by connections.
	 * The events which are exposed and dispatched to this
	 * EventTarget are 'join', 'close', and 'describe.'
	 * 
	 * @type {EventTarget}
	 */
	events;

	/**
	 * Create an RTC pool from a TURN/STUN config and a signaller.
	 * 
	 * @param {Object} base_config - The TURN/STUN configuration.
	 * @param {signalling} signaller - The :class:`signalling` channel.
	 */
	constructor(base_config, signaller) {
		this._config = base_config;
		this._signals = util.withon(
			signaller,
			Pool.SIGNAL_EVENTS,
			evt => evt.detail
		);

		this._conns = {};
		this._managed = {};
		this._descs = {};
		this._polite = {}; // Tracks politeness of connections
		this._cand_buffers = {};
		this._lock_answer = {};
		this._renegotiate = {};

		this._id = null;

		this._signals.onrequest = this._onrequest.bind(this);
		this._signals.onoffer = this._onoffer.bind(this);
		this._signals.onanswer = this._onanswer.bind(this);
		this._signals.onclose = this._onclose.bind(this);
		this._signals.onicecandidate = this._onicecandidate.bind(this);
		this._signals.onjoin = this._onjoin.bind(this);
		this._signals.onstop = this.close.bind(this, 'stop');
		this._signals.ondescribe = this._describe.bind(this);

		this.events = util.withon(new EventTarget(), ['join', 'close', 'describe']);
	}

	/**
	 * Sends a 'join' message to the signalling server to join a pool.
	 * This method will not throw an exception, but if this endpoint is
	 * already part of one, the signalling server will return an error.
	 * 
	 * @param {string} pool - The ID of the pool to join.
	 */
	join(pool) {
		this._signals.send('rtc:join', {
			'pool': pool
		});
	}

	_describe(data) {
		const conn_id = data.uid;
		const conn = this._conns[conn_id];
		if (conn) {
			this._descs[conn_id] = data.description;
			this.events.dispatchEvent(new CustomEvent('describe', {
				detail: {
					connection: util.withattrs(conn, {
						'id': conn_id
					}),
					description: data.description
				}
			}));
		}
	}

	/**
	 * Closes all connections, as well as the signalling channel.
	 * Causes a 'close' event to be dispatched to {this.events}
	 */
	close(evt_type='close') {
		for (const conn of Object.values(this._conns)) {
			conn.close();
		}
		this._signals.close();
		this.events.dispatchEvent(new CustomEvent(evt_type, {
			'detail': null
		}))
	}

	_create_pc(id) {
		const conn = new RTCPeerConnection(this._config);
		conn.addEventListener('icecandidate', (evt) => this._signals.send('rtc:candidate', {
			'from': this._id,
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
				if (this._retains(id)) {
					this.events.dispatchEvent(new CustomEvent('close', {
						'detail': util.withattrs(conn, { 'id': id })
					}));
				}
			default:
				break;
			}
		});
		conn.addEventListener('negotiationneeded', this._negotiate.bind(this, id));

		for (const evt of Pool.EVENTS) {
			conn.addEventListener(evt, this._dispatch.bind(this, id));
		}

		this._conns[id] = conn;
		let managed = new ManagedConnection(conn, id, this._descs);
		this._managed[id] = managed;

		// Good to dispatch before whatever happens next,
		// especially if adding media in listener(s)
		this.events.dispatchEvent(new CustomEvent('peer', {
			detail: {
				connection: managed
			}
		}));

		return conn;
	}

	_dispatch(id, evt) {
		const new_evt = new evt.constructor(evt.type, evt);
		new_evt.connection = id;
		this.events.dispatchEvent(new_evt);
	}

	_get_or_create(id) {
		if (this._retains(id)) {
			return this._conns[id];
		} else {
			const conn = this._create_pc(id);
			return conn;
		}
	}

	async _negotiate(id) {
		const conn = this._conns[id];
		const state = conn.signalingState;
		if (state === "stable") {
			// we can create offer
			const offer = await conn.createOffer();

			// ensure state is still stable
			// (can change by receiving a remote offer)
			// if not stable, cancel this
			if (conn.signalingState !== "stable") return;

			await conn.setLocalDescription(offer);
			this._signals.send("rtc:offers", {
				[id]: offer
			});
		}
	}

	_retains(id) {
		return Object.keys(this._conns).includes(id);
	}

	_onjoin(data) {
		this._id = data.client_id;
		for (const peer of data.peers) {
			const desc = (data.descriptions || {})[peer] || null;
			this._descs[peer] = desc;
			this._polite[peer] = true; // We joined after them, so we must be polite
			this._create_pc(peer);
		}
		this.events.dispatchEvent(new Event('join'));
	}

	async _onrequest(request) {
		const target = request['for'];
		const conn = this._create_pc(target);

		this._descs[target] = null;
		this._polite[target] = false; // We were here before them!
	}

	async _onoffer(offer) {
		const id = offer['for'];
		const conn = this._get_or_create(id);

		const collides = conn.signalingState === "have-local-offer";
		const polite = this._polite[id];
		if (collides && !polite) {
			if (this._lock_answer[id]) {
				this._renegotiate[id] = offer;
			}
			return;
		}

		await conn.setRemoteDescription(offer.offer);
		await this._apply_candidates(id);

		const answer = await conn.createAnswer();
		await conn.setLocalDescription(answer);
		this._signals.send('rtc:answer', {
			'for': id,
			'answer': answer
		});
	}

	async _onanswer(answer) {
		const id = answer['for'];
		this._lock_answer[id] = true;
		const conn = this._conns[id];
		await conn.setRemoteDescription(answer.answer);
		await this._apply_candidates(id);
		this._lock_answer[id] = false;

		const reneg = this._renegotiate[id];
		if (reneg) {
			this._onoffer(reneg);
			delete this._renegotiate[id];
		}
	}

	_onclose(close_req) {
		const conn = this._conns[close_req.uid];
		if (conn) {
			conn.close();
			this.events.dispatchEvent(new CustomEvent('close', {
				'detail': util.withattrs(conn, { 'id': close_req.uid })
			}));
			delete this._conns[close_req.uid];
			delete this._managed[close_req.uid];
			delete this._descs[close_req.uid];
			delete this._polite[close_req.uid];
			delete this._cand_buffers[close_req.uid];
			delete this._lock_answer[close_req.uid];
			delete this._renegotiate[close_req.uid];
		}
	}

	async _onicecandidate(data) {
		const conn = this._conns[data['from']];
		if (!conn.remoteDescription) {
			this._put_candidate(data['from'], data.candidate);
		} else {
			if (data.candidate) await conn.addIceCandidate(data.candidate);
		}
	}

	_put_candidate(id_for, candidate) {
		if (!this._cand_buffers[id_for]) {
			this._cand_buffers[id_for] = [candidate];
		} else {
			this._cand_buffers[id_for].splice(0, 0, candidate);
		}
	}

	_apply_candidates(id_for) {
		const buf  = this._cand_buffers[id_for];
		const conn = this._conns[id_for];
		if (buf) {
			const proms = [];
			while (buf.length > 0) {
				const candidate = buf.pop();
				proms.push(conn.addIceCandidate(candidate));
			}
			return Promise.all(proms);
		} else {
			return Promise.resolve();
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
		return this._managed[id] || null;
	}

	/**
	 * The ID of this endpoint. Will be null if no pool has been joined successfully.
	 * 
	 * @type {string}
	 */
	get id() {
		return this._id;
	}

	/**
	 * A list of every :class:`ManagedConnection`.
	 * 
	 * @type {array}
	 */
	get connections() {
		return Object.values(this._managed);
	}

	/**
	 * The number of connections open.
	 * 
	 * @type {number}
	 */
	get nconnections() {
		return Object.keys(this._conns).length;
	}
};

module.exports = {
	'Pool': Pool
};