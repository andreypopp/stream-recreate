stream-recreate
===============

Recreate stream on 'error' and/or 'end'

To get started, install ``stream-recreate`` package via ``npm``::

    % npm install stream-recreate

After that you will be able to use ``stream-recreate`` library in your code.
The basic usage example is as follows::

    var recreate = require('stream-recreate'),
        websocket = require('websocket-stream');

    var socket = recreate(function() {
      return websocket('ws://localhost:3000');
    });

    socket.write('data');

Returned ``socket`` stream will recreate underlying ``websocket`` stream on its
``end`` and ``error`` event. Recreation algorithm uses backoff_ module to
control the interval between.

To shutdown cleanly call ``socket.end()``.

Note that we can call ``socket.write()`` right after the creation even if
underlying ``websocket()`` stream isn't open yet — ``stream-recreate`` returns
another stream which buffers writes and drains buffers on ``open`` of an
underlying stream.

.. _backoff: https://github.com/MathieuTurcotte/node-backoff
