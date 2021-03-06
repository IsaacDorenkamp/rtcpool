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

.. _descriptions:

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
Likewise, how it receives them is unimportant. RTCPool has built-in
support for socket.io and raw WebSockets as signalling channels, but
you may implement your own by extending :class:`transceiver` and ensuring
the following:

- Implement a ``send`` method that accepts a message type and data as a JSON object.
- Implement code that passively listens for data from the signalling channel,
  and when an event is available, dispatches the event to ``this`` (since
  :class:`transceiver` extends EventTarget)

Perfect Negotiation
-------------------
RTCPool uses perfect negotiation to be sure that all negotiations result
in a successful connections. The details of how perfect negotiation works
are out of the scope of this document; however, the fact that this has
been implemented can let you rest assured that all your connections will
not fail to be established (of course, assuming that you have a functional
TURN/STUN configuration and signalling channel to boot!).

.. note::
     All versions pre-3.0.0 have some negotiation failure cases.
     Each successive version improved upon the shortcomings of the
     previous one, but true perfect negotiation was not achieved until
     version 3.0.0 with a complete rewrite of the internal negotiation
     process.

Managed Connections
-------------------
The primary purpose of RTCPool is to simplify the use of the WebRTC API.
As such, negotiation is completely abstracted away and handled internally.
The :class:`ManagedConnection` class provides all the functionalities of
a WebRTC peer connection that you'd want - media tracks and data channels
galore. Instances of this class are exposed in events and by :attr:`Pool.connections`,
and are what you will always be using unless you are accessing Pool._raw_connections
(DON'T DO THIS - you should have no need to). Additionally, the only events exposed
to :class:`ManagedConnection` are ``track`` and ``datachannel``.

To some, this may seem restrictive, but again, all negotiations are handled internally
for maximal success, and trying to get your hands in that process is only likely to cause
frustration. If you feel you need to get your hands on the raw SDP to add custom information,
save yourself the headache and use :ref:`descriptions` instead. This is the reason they
were implemented!