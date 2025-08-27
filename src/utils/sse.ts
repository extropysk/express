import { IncomingMessage, OutgoingHttpHeaders } from 'http'
import { MessageEvent } from '../types'

const isObject = (fn: any): fn is object => fn && typeof fn === 'object'

function toDataString(data: string | object): string {
  if (isObject(data)) {
    return toDataString(JSON.stringify(data))
  }

  return data
    .split(/\r\n|\r|\n/)
    .map(line => `data: ${line}\n`)
    .join('')
}

export type AdditionalHeaders = Record<string, string[] | string | number | undefined>

interface ReadHeaders {
  getHeaders?(): AdditionalHeaders
}

interface WriteHeaders {
  writableEnded?: boolean
  writeHead?(statusCode: number, reasonPhrase?: string, headers?: OutgoingHttpHeaders): void
  writeHead?(statusCode: number, headers?: OutgoingHttpHeaders): void
  flushHeaders?(): void
  write?(chunk: any, encoding?: BufferEncoding | (() => void), cb?: () => void): boolean
  end?(cb?: () => void): void
  end?(chunk: any, cb?: () => void): void
  end?(chunk: any, encoding: BufferEncoding, cb?: () => void): void
}

export type WritableHeaderStream = NodeJS.WritableStream & WriteHeaders
export type HeaderStream = WritableHeaderStream & ReadHeaders

/**
 * Adapted from https://raw.githubusercontent.com/EventSource/node-ssestream
 * Transforms "messages" to W3C event stream content.
 * See https://html.spec.whatwg.org/multipage/server-sent-events.html
 * A message is an object with one or more of the following properties:
 * - data (String or object, which gets turned into JSON)
 * - type
 * - id
 * - retry
 *
 * If constructed with a HTTP Request, it will optimise the socket for streaming.
 * This class handles SSE formatting without depending on Node.js Transform streams.
 */
export class SseStream {
  private lastEventId: number = 0
  private destination: WritableHeaderStream | null = null
  private isHeadersSent = false

  constructor(req?: IncomingMessage) {
    if (req && req.socket) {
      req.socket.setKeepAlive(true)
      req.socket.setNoDelay(true)
      req.socket.setTimeout(0)
    }
  }

  /**
   * Connect to a writable stream (like HTTP Response)
   */
  pipe<T extends WritableHeaderStream>(
    destination: T,
    options?: {
      additionalHeaders?: AdditionalHeaders
      end?: boolean
    },
  ): T {
    this.destination = destination

    if (destination.writeHead && !this.isHeadersSent) {
      destination.writeHead(200, {
        ...options?.additionalHeaders,
        // See https://github.com/dunglas/mercure/blob/master/hub/subscribe.go#L124-L130
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        // Disable cache, even for old browsers and proxies
        'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0, no-transform',
        Pragma: 'no-cache',
        Expire: '0',
        // NGINX support https://www.nginx.com/resources/wiki/start/topics/examples/x-accel/#x-accel-buffering
        'X-Accel-Buffering': 'no',
      })
      destination.flushHeaders?.()
      this.isHeadersSent = true
    }

    // Send initial newline
    destination.write?.('\n')
    return destination
  }

  /**
   * Transform a message event into SSE format
   */
  private formatMessage(message: MessageEvent): string {
    let data = message.type ? `event: ${message.type}\n` : ''
    data += message.id ? `id: ${message.id}\n` : ''
    data += message.retry ? `retry: ${message.retry}\n` : ''
    data += message.data ? toDataString(message.data) : ''
    data += '\n'
    return data
  }

  /**
   * Write a message to the connected destination
   */
  write(message: MessageEvent): boolean {
    if (!this.destination) {
      throw new Error('No destination connected. Call pipe() first.')
    }

    if (!message.id) {
      this.lastEventId++
      message.id = this.lastEventId.toString()
    }

    const formattedMessage = this.formatMessage(message)
    return this.destination.write?.(formattedMessage) ?? false
  }

  /**
   * Write a message with callback handling (similar to the original writeMessage)
   */
  writeMessage(message: MessageEvent, cb: (error: Error | null | undefined) => void): void {
    if (!this.destination) {
      process.nextTick(() => cb(new Error('No destination connected. Call pipe() first.')))
      return
    }

    if (!message.id) {
      this.lastEventId++
      message.id = this.lastEventId.toString()
    }

    const formattedMessage = this.formatMessage(message)

    if (!this.destination.write?.(formattedMessage)) {
      // If write returns false, wait for drain event
      this.destination.once?.('drain', cb)
    } else {
      process.nextTick(cb)
    }
  }

  /**
   * End the stream
   */
  end(cb?: () => void): void {
    if (this.destination) {
      this.destination.end?.(cb)
    } else if (cb) {
      process.nextTick(cb)
    }
  }

  /**
   * Get the formatted SSE string for a message (utility method)
   */
  formatMessageToString(message: MessageEvent): string {
    if (!message.id) {
      this.lastEventId++
      message.id = this.lastEventId.toString()
    }
    return this.formatMessage(message)
  }
}
