Managing Media
--------------

WebRTC is commonly used for streaming media - and no wonder! Because of
this, I have added a special helper class for making manging media with
pools easy. The :class:`ManagedStream` class allows you to easily set up
a stream to be sent to all peers with ease. Suppose we have a MediaStream
called ``stream`` that we would like to stream to all peers in the pool.
This can be done with little effort:

.. code-block:: javascript

	const pool = new rtcpool.Pool({ /* TURN/STUN configuration */ }, signals);
	let managed;
	pool.onjoin = () => {
		managed = new rtcpool.media.ManagedStream(stream, pool);
	};
	pool.join('my-friends');

:class:`ManagedStream` does the rest. Any peers that join will receive the
stream. If pool already had peers when the media was added, then they also
would receive the stream as soon as it was added. And since RTCPool implements
automatic re-negotiation, we don't even have to worry about the negotiation
process and can simply allow the process to unfold on its own.