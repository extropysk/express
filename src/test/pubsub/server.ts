/* eslint-disable @typescript-eslint/ban-types */

import { CustomTransportStrategy, Server } from '../../pubsub'

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
