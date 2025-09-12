import { PubSubClient } from '@/test/pubsub/client'
import { timeout, TimeoutError } from 'rxjs'

import { describe, it, expect, vi } from 'vitest'

describe('PubSubClient', () => {
  const client = new PubSubClient()

  it('should send and receive a response via publish callback', async () => {
    // Spy on publish to see it gets called
    const publishSpy = vi.spyOn(client, 'publish')

    // Wrap the async observable response in a Promise for testing
    const result = await new Promise(resolve => {
      client.send('pattern', 'Hello world!').subscribe(response => {
        resolve(response)
      })
    })

    // Assert that publish was called with a ReadPacket-like object
    expect(publishSpy).toHaveBeenCalled()
    const [packetArg, callbackArg] = publishSpy.mock.calls[0]
    expect(packetArg).toEqual(expect.objectContaining({ data: 'Hello world!' }))
    expect(typeof callbackArg).toBe('function')

    // Assert that the observable emits the simulated response
    expect(result).toBe('Hello world!')
  })

  it('should call teardown when unsubscribed (via timeout)', async () => {
    const client = new PubSubClient()
    const consoleSpy = vi.spyOn(console, 'log')

    await new Promise<void>(resolve => {
      client
        .send('pattern', 'Hello world!')
        .pipe(timeout({ each: 200 }))
        .subscribe({
          next: () => {},
          error: err => {
            expect(err).toBeInstanceOf(TimeoutError)

            // Teardown should be called after timeout unsubscribes
            expect(consoleSpy).toHaveBeenCalledWith('teardown')
            resolve()
          },
        })
    })
  })

  it('should call dispatchEvent when emit is used', async () => {
    const dispatchSpy = vi.spyOn(client, 'dispatchEvent')

    client.emit('event', 'Hello world!')

    await vi.waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          pattern: 'event',
          data: 'Hello world!',
        }),
      )
    })
  })
})
