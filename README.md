# Recreate stream in case of error

To get started, install `stream-recreate` package via `npm`:

    % npm install stream-recreate

The basic usage example is as follows:

    var recreate = require('stream-recreate'),
        websocket = require('websocket-stream');

    var socket = recreate(function() {
      return websocket('ws://localhost:3000');
    });

    socket.write('data');

Returned `socket` stream will recreate underlying `websocket` stream if `end` or
`error` event is occurred. It uses [backoff][backoff] module to control the
interval between attempts to recreate a stream.

To shutdown cleanly call `socket.end()`.

Note that we can call `socket.write()` right after the creation even if
underlying `websocket()` stream isn't open yet — `stream-recreate` returns
another stream which buffers writes and drains buffers on `open` of an
underlying stream.

[backoff]: https://github.com/MathieuTurcotte/node-backoff
