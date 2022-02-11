rtcpool.signalling
==================

Transcievers
------------

Transceivers are direct interfaces to a
sender/receiver. They are simply a way
to standardize different methods of sending
and receiving data

.. autoclass:: transceiver
	:members:

.. autoclass:: sio_transceiver
	:members:

.. autoclass:: websocket_transceiver
	:members:

Signalling
----------

Signalling classes are the actual signal
senders/handlers that are used by :class:`Pool`
to negotiate the RTC connections.

.. autoclass:: signalling
	:members:

.. autoclass:: socketio
	:members:

.. autoclass:: websocket
	:members: