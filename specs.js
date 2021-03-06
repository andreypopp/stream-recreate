"use strict";

var assert      = require('assert');
var PassThrough = require('stream').PassThrough;
var recreate    = require('./index');

describe('stream-recreate', function() {

  it('emits an "open" event on underlying stream "open"', function(done) {
    var stream = recreate(function() { return new PassThrough(); });

    stream.on('open', done);
    stream.underlying.emit('open');
  });

  it('emits an "underlying-open" event on underlying stream "open"', function(done) {
    var stream = recreate(function() { return new PassThrough(); });

    stream.on('underlying-open', done);
    stream.underlying.emit('open');
  });

  it('recreates stream on end of underlying stream', function(done) {
    var stream = recreate(function() { return new PassThrough(); });
    var underlying = stream.underlying;

    var backoffScheduleSeen = false;

    stream.on('backoff-schedule', function() {
      backoffScheduleSeen = true;
    });

    stream.on('backoff-ready', function() {
      assert.ok(backoffScheduleSeen);
      stream.on('underlying-open', function() {
        assert.notEqual(stream.underlying, underlying, 'new stream should be created');
        done();
      });
      stream.underlying.emit('open');
    });

    underlying.end();
  });

  it('recreates stream on error of underlying stream', function(done) {
    var stream = recreate(function() { return new PassThrough(); });
    var underlying = stream.underlying;

    var backoffScheduleSeen = false;

    stream.on('backoff-schedule', function() {
      backoffScheduleSeen = true;
    });

    stream.on('backoff-ready', function() {
      assert.ok(backoffScheduleSeen);
      stream.on('underlying-open', function() {
        assert.notEqual(stream.underlying, underlying, 'new stream should be created');
        done();
      });
      stream.underlying.emit('open');
    });

    stream.underlying.emit('error', new Error('x'));
  });

  it('shutdowns stream by calling end()', function(done) {
    var stream = recreate(function() { return new PassThrough(); });

    var backoffScheduleSeen = false;

    stream.on('backoff-schedule', function() {
      backoffScheduleSeen = true;
    });

    stream.on('end', function() {
      assert.ok(!backoffScheduleSeen);
      done();
    });

    stream.end();
  });
});
