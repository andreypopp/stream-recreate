/**
 * Recreate streams on 'end' and/or 'error' events.
 */

var through = require('through');
var backoff = require('backoff');

function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}

/**
 * Create wrapper stream which takes care of recreating logic.
 *
 * @param {Function} makeStream a function which returns a stream
 * @param {Object}
 */
function recreate(makeStream, options) {
  if (options == null) {
    options = {};
  }
  if (options === undefined && isObject(makeStream)) {
    options = makeStream;
    makeStream = options.makeStream;
  }
  if (options.connect === undefined) {
    options.connect = true;
  }

  var connectedEvent = options.connectedEvent || 'open';

  var stream = through();
  stream.inverse = through();

  stream.inverse.pause();

  stream.write = function(chunk) {
    return stream.inverse.write(chunk);
  };

  stream.connect = function() {
    stream.underlying = makeStream();

    stream.inverse.pipe(stream.underlying, {end: false});

    stream.underlying.on('data', function(chunk) {
      return stream.emit('data', chunk);
    });

    stream.underlying.on(connectedEvent, function() {
      stream.backoff.reset();
      stream.inverse.resume();
      stream.emit('open');
      stream.emit('underlying-open');
    });

    stream.underlying.on('end', function() {
      stream.inverse.pause();
      if (!stream.preventBackoff) {
        stream.backoff.backoff();
      }
      stream.emit('underlying-end');
    });

    stream.underlying.on('error', function(e) {
      stream.inverse.pause();
      if (!stream.preventBackoff) {
        stream.backoff.backoff();
      }
      stream.emit('underlying-error');
    });
  };

  var origEnd = stream.end.bind(stream);

  stream.end = function() {
    stream.preventBackoff = true;
    stream.underlying.end();
    return origEnd();
  };

  stream.backoff = options.backoff || backoff.exponential(options);

  stream.backoff.on('backoff', function(num, delay) {
    stream.emit('backoff-schedule', num, delay);
  });

  stream.backoff.on('ready', function() {
    stream.emit('backoff-ready');
    stream.connect();
  });

  stream.backoff.on('fail', function() {
    stream.emit('backoff-fail');
  });


  if (options.connect) {
    stream.connect();
  }

  return stream;
};

module.exports = recreate;
