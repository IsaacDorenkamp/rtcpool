Concepts
========

Endpoints
---------
An "endpoint" is a single client, usually referring
to a client which is in an RTC pool.

Pools
-----
Pools are collections of RTC connections. They are actually
managed by the signalling channels, so even if no RTC connections
have actually been negotiated, individual endpoints are made aware
of their peers and know who to send offers to when appropriate. A
single pool might be a video chat room, for instance.

Descriptions
------------
RTCPool implements a system whereby connections can be associated
with descriptions - arbitrary JSON objects which can be used to
provide further information about the endpoint. Descriptions are
meant to be considered trustworthy, so setting descriptions is
something that can only be done from the back-end. You can get
an endpoint's description with :meth:`Pool.get_description`.

Signalling
----------
A signalling channel is simply an object that sends and receives
RTC negotiation messages. How it sends them is unimportant, but
they are sent via a ``send(message_type, message_data)`` method.
Likewise, how it receives them is unimportant. A signalling class
should be a subclass of ``EventTarget``, and when it receives an
event from the server, it dispatches an event to itself.
The event names are mapped accordingly:

====================   ========================
Received From Server   Type of event dispatched
====================   ========================
     rtc:joined                 join
     rtc:describe              describe
 rtc:request_offers            request
      rtc:offer                 offer
      rtc:answer                answer
      rtc:close                 close
     rtc:candidate            candidate
       rtc:stop                  stop
====================   ========================

RTCPool has built in support for raw WebSocket signalling and
socket.io signalling, but you can build your own signalling class
by creating a class which functions as described above.

To simplify things, the :class:`signalling` automatically handles
the event mapping. All you must do is extend :class:`transceiver`,
and then you can create a signalling instance with something like
the below::

	const signalling = new rtcpool.signalling(new MyTransceiver());

Perfect Negotiation
-------------------
RTCPool uses perfect negotiation to be sure that all negotiations result
in a successful connections. The details of how perfect negotiation works
are out of the scope of this document; however, the fact that this has
been implemented can let you rest assured that all your connections will
not fail to be established (of course, assuming that you have a functional
TURN/STUN configuration and signalling channel to boot!).

.. note::
     While previous versions claimed to implement perfect negotiation,
     rigorous tests later showed otherwise. Now, those rigorous tests
     have been shown to pass flawlessly, and as long as the TURN/STUN
     configuration are valid and the signalling channel is reliable,
     negotiation and re-negotiation should be managed properly 100%
     of the time.