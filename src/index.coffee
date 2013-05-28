###

  Recreate streams on end and/or error

###

through = require 'through'
backoff = require 'backoff'

module.exports = (makeStream, options = {}) ->
  if options is undefined and makeStream.toString() == '[object Object]'
    options = makeStream
    makeStream = options.makeStream

  if options.connect is undefined
    options.connect = true

  connectedEvent = options.connectedEvent or 'open'

  log = (msg) ->
    return if options.log is null
    if options.log then options.log(msg) else console.log(msg)

  cleanup = ->
    stream.underlying.removeListener('data', passData)

  passData = (chunk) ->
    console.log 'i:', chunk
    stream._data(chunk)

  stream = through()
  stream.inverse = through()
  stream.inverse.pause()

  stream.write = (chunk) ->
    stream.inverse.write(chunk)

  stream.backoff = options.backoff or backoff.exponential(options)

  stream.backoff.on 'backoff', (num, delay) ->
    log "next connection attempt in #{delay}ms"

  stream.backoff.on 'ready', ->
    log "trying to re-establish connection"
    stream.connect()

  stream.backoff.on 'fail', ->
    log "out of attempts to re-establish connection"

  stream.connect = ->
    stream.underlying = makeStream()

    stream.inverse
      .pipe(stream.underlying, end: false)

    stream.underlying.on 'data', (chunk) ->
      stream.emit 'data', chunk

    stream.underlying.on 'open', ->
      log "connection established"
      stream.backoff.reset()
      stream.inverse.resume()

    stream.underlying.on 'end', ->
      log "connection terminated"
      stream.inverse.pause()
      cleanup()
      stream.backoff.backoff() unless stream.preventBackoff

    stream.underlying.on 'error', (e) ->
      log "error #{e}"
      stream.inverse.pause()
      cleanup()
      stream.backoff.backoff() unless stream.preventBackoff

  origEnd = stream.end.bind(stream)
  stream.end = ->
    stream.preventBackoff = true
    stream.underlying.end()
    origEnd()

  stream.connect() if options.connect
  stream
