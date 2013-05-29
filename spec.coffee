{ok, deepEqual, equal, notEqual} = require 'assert'
{PassThrough} = require 'stream'
recreate = require './src/index'

describe 'stream-recreate', ->

  it 'emits "open" event on underlying stream "open"', (done) ->

    stream = recreate (-> new PassThrough), log: null

    stream.on 'open', done
    stream.underlying.emit 'open'

  it 'recreates stream on end of underlying stream', (done) ->

    stream = recreate (-> new PassThrough), log: null

    underlying1 = stream.underlying
    stream.backoff.on 'ready', ->
      stream.underlying.on 'open', ->
        notEqual stream.underlying, underlying1
        done()
      stream.underlying.emit 'open'
    stream.underlying.end()

  it 'recreates stream on error of underlying stream', (done) ->

    stream = recreate (-> new PassThrough), log: null

    underlying1 = stream.underlying
    stream.backoff.on 'ready', ->
      stream.underlying.on 'open', ->
        notEqual stream.underlying, underlying1
        done()
      stream.underlying.emit 'open'
    stream.underlying.emit 'error', new Error('x')
