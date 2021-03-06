Signalling Protocol - ssp
-------------------------

RTCPool uses a custom designed signalling protocol intended
to be a standard for managing pools of WebRTC connections.
My other project, `PyRTC <https://github.com/IsaacDorenkamp/PyRTC>`_,
implements this signalling protocol and is maintained alongside
RTCPool, so any breaking changes to the protocol are kept up to
date between both projects consistently.

The protocol, named ssp (Sdp Signalling Protocol), has two versions.
All versions of RTCPool <3.0.0 use v1, while 3.0.0+ use v2. I will
detail the signalling events of v2 here and then explain the differences
with v1 and why they were made. ssp is based on events, which have a
type (string) and data (JSON object). The events are as follows:

+--------------+---------------+--------------------------+------------------------------------------------------+
|  Event Type  |  Received By  |  Description             |  Event Data                                          |
+==============+===============+==========================+======================================================+
|   rtc:join   |     Server    | Used to join a pool.     |  - pool: The unique ID of the pool to join.          |
+--------------+---------------+--------------------------+------------------------------------------------------+
|  rtc:joined  |     Client    | Notifies the client that |  - client_id: The unique ID assigned to this client. |
|              |               | they have successfully   |  - peers: An array of unique IDs corresponding to    |
|              |               | joined the pool.         |    the other peers in this pool.                     |
|              |               |                          |  - descriptions: A map whose keys are peer IDs and   |
|              |               |                          |    whose values are the JSON descriptions of those   |
|              |               |                          |    peers.                                            |
|              |               |                          |  - pool: The ID of the pool joined.                  |
+--------------+---------------+--------------------------+------------------------------------------------------+
|   rtc:sdp    |     Server    | Used to relay an SDP     |  - to: The unique ID of the peer to send to.         |
|              |               | description to another   |  - description: The SDP description object.          |
|              |               | peer.                    |                                                      |
+--------------+---------------+--------------------------+------------------------------------------------------+
|   rtc:sdp    |     Client    | The SDP description of   |  - peer: The unique ID of the peer sending the SDP.  |
|              |               | another peer.            |  - description: The SDP description object.          |
+--------------+---------------+--------------------------+------------------------------------------------------+
|rtc:candidate |     Server    | Used to relay an ICE     |  - for: The unique ID of the peer which should       |
|              |               | candidate to another     |    receive the ICE candidate.                        |
|              |               | peer.                    |  - candidate: The ICE candidate object.              |
+--------------+---------------+--------------------------+------------------------------------------------------+
|rtc:candidate |     Client    | An ICE candidate sent by |  - from: Then unique ID of the peer who sent the     |
|              |               | another peer during      |    ICE candidate.                                    |
|              |               | negotiation.             |  - candidate: The ICE candidate object.              |
+--------------+---------------+--------------------------+------------------------------------------------------+
|   rtc:peer   |     Client    | Sent by the server to    |  - id: The unique ID of the peer that has joined.    |
|              |               | notify existing peers    |                                                      |
|              |               | when a new peer joins.   |                                                      |
+--------------+---------------+--------------------------+------------------------------------------------------+
|  rtc:close   |     Client    | Sent by the server to    |  - id: The unique ID of the peer that has left.      |
|              |               | notify peers when a      |                                                      |
|              |               | peer has left/closed.    |                                                      |
+--------------+---------------+--------------------------+------------------------------------------------------+
|   rtc:stop   |     Client    | Sent by the server to    |  None. This event is only sent to peers in the       |
|              |               | indicate that it is      |  relevant pool.                                      |
|              |               | force-closing a pool.    |                                                      |
+--------------+---------------+--------------------------+------------------------------------------------------+
| rtc:describe |     Client    | Sent by the server to    |  - description: The JSON description of the peer.    |
|              |               | indicate that a peer's   |  - id: The unique ID of the peer.                    |
|              |               | description has changed. |                                                      |
+--------------+---------------+--------------------------+------------------------------------------------------+
|   rtc:error  |     Client    | Indicates invalid data   |  - message: The error message.                       |
|              |               | was sent by the client.  |  - reason: A developer-friendly error reason.        |
+--------------+---------------+--------------------------+------------------------------------------------------+

.. note::
	The ``rtc:describe`` event has nothing to do with the SDP offers/answers, but rather an extra convenience added
	in this protocol to make identification and description of peers easier for developers. For more information, see
	:ref:`descriptions`.

.. note::
	A keen observer may notice that the ``rtc:joined`` event has a ``pool`` field in its data. Why is this, if the client
	already knows the name of the pool it has joined? There is a reason. While my own implementation does have a 1:1
	correspondence between the pool ID the client requests to join and the pool that is actually joined, the protocol
	is designed to have flexibility to allow back-end developers to have their own custom implementation of this feature.
	For example, a front-end developer might be able to have a single fixed line of code like ``pool.join('friends')``\,
	and the back-end developer might associate this with a pool that has a UUID for a name which groups together the
	client with his group of friends, for example. In this case, the client would send a ``rtc:join`` event with 
	the pool name ``friends`` while the server would return an ``rtc:joined`` event with the pool having a value like
	``99699254-0d94-4374-b3da-7d08c06f041d``\.

Differences from v1
===================
ssp-v1 had a few glaring differences (yes, that is a WebRTC pun). For one, there were two separate events for sending
SDP descriptions, one for offers and one for answers. Originally, offers could be sent in bulk (multiple offers to
different peers in one event), but as the architecture improved, this was abandoned, and the event ended up being used
to only send a single event. This separation in events made perfect negotiation difficult, and this is a significant
reason why v2 was developed. Replacing the two events with a single SDP event made perfect negotiation not only feasible,
but rather simple. In very early versions of RTCPool, media was handled manually, and instead of an ``rtc:peer`` event,
there was an event called ``rtc:request_offers`` that served two purposes. One was the same as ``rtc:peer``, that is, to notify
other peers of a newly joined peer. The other was to request SDP offers for any media that the specified peer had. This
approach was clunky and completely ignored the brilliant ``negotiationneeded`` event that I should have used all along.
As the architecture evolved, this event ended up no longer being used for requesting media offers, but rather only to
notify peers of newly joined peers. Thus, in v2, I renamed the event to ``rtc:peer`` for clarity.

Another minor difference from ssp-v1 is that some events that have ``id`` fields instead had ``uid`` fields. I saw no need
for the ``u``, so I scrapped it for clarity. RTCPool 3.0.0 still uses ``uid``, but 3.0.1 will patch this. For compatibility,
PyRTC 2.0.0 sends both ``uid`` and ``id`` fields so as to be compatible with all versions of RTCPool 3.0.0+.