const util = require('./util');
const media = require('./media');

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
		this._descs = {};
		this._polite = {}; // Tracks politeness of connections
		this._cand_buffers = {};
		this._renegotiate = {};

		this._neg_state = {};
		this._id = null;

		this._media = [];

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
	 * Add media which will be streamed/opened on all peers, current and future.
	 * 
	 * @param {RTCStream|BroadcastDataChannel} medium - An object representing media to be broadcast.
	 */
	add_media(medium) {
		for (const conn of Object.values(this._conns)) {
			medium.apply(conn);
		}

		this._media.push(medium);
	}

	/**
	 * Internally recalculates which media should be retained, and returns the list of media.
	 * Media which are removed are those which have been closed.
	 * 
	 * @return {array} The list of media currently being broadcast by this endpoint.
	 */
	get_media() {
		this._media = this._media.filter(medium => !medium.closed);
		return this._media;
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

	/**
	 * Creates a one-to-one data channel with the endpoint identified
	 * by conn_id with the given label and options.
	 * 
	 * @param {string} conn_id - The ID of the connection to create a data channel for.
	 * @param {string} label - The label to assign to the data channel.
	 * @param {Object} options - The RTCDataChannel options to create the channel with.
	 * @return {RTCDataChannel|null} - An RTCDataChannel to the desired endpoint, or null if the connection doesn't exist.
	 */
	dataChannel(conn_id, label, options={}) {
		const pc = this._conns[conn_id];
		if (pc) {
			return pc.createDataChannel(label, options);
		} else {
			return null;
		}
	}

	/**
	 * Creates an object representing a broadcast data channel. It will open
	 * a data channel with all existing peers, and any future peers that join.
	 * 
	 * @param {string} label - The label to assign to the data channel(s) that are created.
	 * @param {Object} options - The RTCDataChannel options to create the channel with.
	 */
	broadcastDataChannel(label, options={}) {
		const bdc = new media.BroadcastDataChannel(label, options);
		this.add_media(bdc);
		return bdc;
	}

	_create_pc(id) {
		const conn = new RTCPeerConnection(this._config);
		for (const medium of this.get_media()) {
			medium.apply(conn);
		}
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
		const neg_state = this._neg_state[id] || null;
		if (neg_state !== null) {
			this._neg_state[id] = "restart";
		} else {
			this._neg_state[id] = "making-offer";
			const off = await conn.createOffer();
			// check state again
			if (this._neg_state[id] === "rollback") {
				// received offer, rollback
				delete this._neg_state[id];
				return;
			}
			await conn.setLocalDescription(off);
			if (this._neg_state[id] === "rollback") {
				delete this._neg_state[id];
				return;
			}
			this._signals.send('rtc:offers', {
				[id]: off
			});

			if (this._neg_state[id] == "restart") {
				// we have been told to re-calculate
				// our offer by an event
				delete this._neg_state[id];
				this._negotiate(id);
			} else {
				this._neg_state[id] = "waiting";
			}
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

		const state = this._neg_state[id] || null;

		let rollback = false;
		if (state !== null) {
			if (state === "has-answer") {
				/* this state simply means an answer is being
				   processed. even if we are impolite, we still
				   should consider this answer, as it indicates
				   a change in the negotiated content. this is confirmed
				   to fix a bug where an offer is ignored because the
				   impolite peer is busy handling an old answer */
				this._renegotiate[id] = offer;
				return;
			}

			// this endpoint has also created its own offer.
			// if this endpoint is impolite, it will reject it.
			const polite = this._polite[id];
			if (!polite) {
				// completely ignore the offer
				return;
			} else {
				this._neg_state[id] = "rollback";
				rollback = state != "making-offer";
			}
		}

		if (rollback) {
			await Promise.all([
				conn.setLocalDescription({ type: "rollback" }),
				conn.setRemoteDescription(offer.offer)
			]);
		} else {
			await conn.setRemoteDescription(offer.offer);
		}
		await this._apply_candidates(id); 

		const ans = await conn.createAnswer();
		await conn.setLocalDescription(ans);
		this._signals.send('rtc:answer', {
			'from': this.id,
			'for': id,
			'answer': ans
		});

		delete this._neg_state[id];
	}

	async _onanswer(answer) {
		const conn = answer['for'];
		this._neg_state[conn] = "has-answer";
		const conn_for = this._conns[conn];
		await conn_for.setRemoteDescription(answer.answer);
		await this._apply_candidates(conn);
		delete this._neg_state[conn];

		const reneg_offer = this._renegotiate[conn];
		if (reneg_offer) {
			delete this._renegotiate[conn];
			this._onoffer(reneg_offer);
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
			delete this._descs[close_req.uid];
			delete this._polite[close_req.uid];
		}
	}

	async _onicecandidate(data) {
		const conn = this._conns[data['from']];
		if (!conn.remoteDescription) {
			this._put_candidate(data['from'], data.candidate);
		} else {
			await conn.addIceCandidate(data.candidate);
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
	 * @param {string} uid - The ID of the endpoint connection to get.
	 * @return {RTCPeerConnection|null} The RTCPeerConnection to the desired
	 *         endpoint, or null if it does not exist.
	 */
	get_connection(uid) {
		return this._conns[uid] || null;
	}

	/**
	 * Gets the description associated with the specified endpoint.
	 * 
	 * @param {string} uid - The ID of the endpoint whose description to get.
	 * @return {Object|null|undefined} The description of the endpoint, null if the description is null, and undefined if the endpoint does not exist.
	 */
	get_description(uid) {
		return this._descs[uid];
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
	 * A list of all RTCPeerConnections, each with an additional 'uid' attribute
	 * representing the ID of the endpoint that it is connected to.
	 * 
	 * @type {array}
	 */
	get connections() {
		return Object.entries(this._conns).map(entry => util.withattrs(entry[1], {
			'uid': entry[0]
		}));
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