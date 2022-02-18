===========
Pool How-To
===========

While the API Reference is fairly thorough, it does not do much
in the way of describing the important events dispatched to
:attr:`Pool.events`. This section will describe what events are
used, what data they receive, and so on. These events will be
important if you want to make effective use of RTCPool, so be
sure to make note of this content!

join
====

This event is dispatched when the :class:`Pool` has successfully
connected to the pool on the server-side. Before this event is fired,
no connections are available, and attempting to create media with the
it will not work. If you wish to add media to a stream ASAP, wait until
this event has been fired and then do so. For example, do this:

.. code-block:: javascript

	const pool = new rtcpool.Pool({ /* TURN/STUN config */ }, signaller);
	let media;
	pool.events.onjoin = () => {
		media = new rtcpool.media.ManagedStream(someMediaStream, pool);
	};

NOT this:

.. code-block:: javascript

	const pool = new rtcpool.Pool({ /* TURN/STUN config */ }, signaller);
	let media = new rtcpool.media.ManagedStream(someMediaStream, pool);

close
=====

This event is dispatched when either another peer has closed, or when
this peer has been instructed to close. This event *will* be fired even
when :meth:`Pool.close` is called, so be aware. The connection that was
closed can be accessed in event.detail, as such:

.. code-block:: javascript

	pool.events.onclose = event => {
		console.log("Closed connection to", event.detail);
	};

If event.detail is ``null``, this indicates that *this* endpoint was the
peer that was closed.

stop
====

Like the close event, but called when the server force-closes the pool.
event.detail will always be null.

.. warning::
	In RTCPool 3.0.0, assigning Pool.events.onstop will *NOT* work. This
	will be patched in version 3.0.1. For this event, it is best to simply
	use ``addEventListener``.

peer
====

This event is dispatched when a new peer has joined the pool. The
:class:`ManagedConnection` may be accessed in ``event.detail.connection``.

.. code-block:: javascript

	pool.events.onpeer = event => {
		const peer = event.detail.connection;
		console.log("I have a new friend! His name is " + peer.id);
	};

describe
========

This event is dispatched when a peer's description is changed.
Both the peer's :class:`ManagedConnection` and the description object
are included in ``event.detail``, as ``event.detail.connection`` and
``event.detail.description`` respectively. Example:

.. code-block:: javascript

	pool.events.ondescribe = event => {
		const { connection, description } = event.detail;
		console.log("My friend " + connection.id + " got a car. It is a " + description.car);
	};

.. note::
	Recall that descriptions are arbitrary, so do not depend on data that might
	not be present. It is up to the developer how descriptions will be used and
	what information they will contain.