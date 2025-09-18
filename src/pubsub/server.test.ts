/* eslint-disable @typescript-eslint/ban-types */

import { describe, it, expect, vi } from 'vitest'

import { of } from 'rxjs'
import { BaseRpcContext, Server } from '@/pubsub/server'
import { CustomTransportStrategy } from '@/types/pubsub'

export class PubSubServer extends Server implements CustomTransportStrategy {
  /**
   * Triggered when you run "app.listen()".
   */
  listen(callback: () => void) {
    callback()
  }

  /**
   * Triggered on application shutdown.
   */
  close() {}

  /**
   * You can ignore this method if you don't want transporter users
   * to be able to register event listeners. Most custom implementations
   * will not need this.
   */
  on(_event: string, _callback: Function) {
    throw new Error('Method not implemented.')
  }

  /**
   * You can ignore this method if you don't want transporter users
   * to be able to retrieve the underlying native server. Most custom implementations
   * will not need this.
   */
  unwrap<T = never>(): T {
    throw new Error('Method not implemented.')
  }
}

describe('PubSubServer', () => {
  const server = new PubSubServer()

  it('should call listen callback', () => {
    const cb = vi.fn()
    server.listen(cb)
    expect(cb).toHaveBeenCalled()
  })

  it('should allow close() to be called', () => {
    expect(() => server.close()).not.toThrow()
  })

  it('should throw on unimplemented on()', () => {
    expect(() => server.on('event', () => {})).toThrow('Method not implemented.')
  })

  it('should throw on unimplemented unwrap()', () => {
    expect(() => server.unwrap()).toThrow('Method not implemented.')
  })

  it('should add and retrieve a handler', async () => {
    const server = new PubSubServer()
    const handler = vi.fn().mockResolvedValue('ok')

    server.addHandler('pattern', handler)
    const retrieved = server.getHandlerByPattern('pattern')

    expect(retrieved).toBe(handler)

    const context = new BaseRpcContext(['arg1'])
    await server.handleEvent(
      'pattern',
      { pattern: 'pattern', data: 'payload' }, // ✅ now valid ReadPacket
      context,
    )

    expect(handler).toHaveBeenCalledWith('payload', context)
  })

  it('should log error if no handler for event', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await server.handleEvent(
      'missing',
      { pattern: 'missing', data: 'payload' }, // ✅ include pattern
      new BaseRpcContext([]),
    )

    expect(consoleSpy).toHaveBeenCalledWith(
      'There is no matching event handler defined in the remote service. Event pattern: missing',
    )
  })

  it('should transform value, promise, and observable into observables', async () => {
    const value$ = server.transformToObservable(42)
    await expect(value$.toPromise()).resolves.toBe(42)

    const promise$ = server.transformToObservable(Promise.resolve(7))
    await expect(promise$.toPromise()).resolves.toBe(7)

    const obs$ = server.transformToObservable(of('hi'))
    await expect(obs$.toPromise()).resolves.toBe('hi')
  })

  it('should getOptionsProp return value or default', () => {
    const options = { foo: 'bar' }

    expect(server.getOptionsProp(options, 'foo')).toBe('bar')
    expect(server.getOptionsProp(options, 'missing' as any, 'default')).toBe('default')
  })
})
