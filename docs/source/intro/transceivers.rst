Transceivers
------------
To send data to the signalling back end, we need an object
called a *transceiver* to send and receive signals over a
data transfer channel. WebSockets are a popular way to do
this, but not the only way. RTCPool has built-in support for
transceivers using socket.io or native WebSockets, but you can
create a custom transceiver to send and receive signals over any
channel. You could even use ``XMLHttpRequest``\s if you had some good
reason to!

Built-in Transceivers
=====================
The built-in transceivers are not exposed, rather they are implied in
two helper classes, ``socketio`` and ``websocket``, which are subclasses
of :class:`signalling` that automatically implement their respective
transceiver.

To use native WebSockets as a signalling channel, create a signalling
object as follows:

.. code-block:: javascript

	const ws = new WebSocket("ws://example.com/rtc-endpoint");
	const signals = new rtcpool.signalling.websocket(ws);

To use a socket.io ``io`` instance, create a signalling object as follows:

.. code-block:: javascript

	const sockio = io();
	const signals = new rtcpool.signalling.socket.io(sockio);

Other transceivers can be used by directly creating a :class:`signalling` instance:

.. code-block:: javascript

	const signals = new rtcpool.signalling.signalling(new MyTransceiver());

Custom Transceivers
===================
As mentioned elsewhere, it is possible to use
your own signalling channel with RTCPool. In order
to do this, you simply need to extend :class:`transceiver`
and implement sending and receiving. The way to do this is 
may not be entirely clear, but this example may help to
clear things up. Let's say we have a polling XHR transport
that sends and receives events as 2-arrays (i.e. ``[type, data]``)
on each request. A transceiver via this channel may look like this:

.. code-block:: javascript

	class XHRTransceiver extends rtcpool.signalling.transceiver {
		constructor(url) {
			super();
			this.url = url;
			this.send = [];

			this.timeout = null;

			this.poll();
		}

		send(type, data) {
			this.send.push([type, data]);
		}

		close() {
			if (this.timeout) {
				clearTimeout(this.timeout);
			}
		}

		poll() {
			const events = JSON.stringify(this.send);
			this.send = [];

			const xhr = new XMLHttpRequest();
			xhr.setRequestHeader('Content-type', 'application/json');
			xhr.open('GET', this.url);
			xhr.onreadystatechange = () => {
				if (xhr.readyState === 4) {
					const data = JSON.parse(xhr.responseText);
					for (const evt of data) {
						this.dispatchEvent(new CustomEvent(evt[0], {
							detail: evt[1]
						}));
					}
				}

				setTimeout(this.poll.bind(this), 250);
			};
			xhr.send(events);
		}
	}

Then you could use it with a pool as follows:

.. code-block:: javascript

	const signals = new rtcpool.signalling.signalling(new XHRTransceiver(somePollingAPI));
	const pool = new rtcpool.Pool({ /* TURN/STUN configuration */ }, signals);
	pool.onjoin = ...