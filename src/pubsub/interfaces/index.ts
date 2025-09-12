import { Observable } from 'rxjs'

export interface PacketId {
  id: string
}

export interface ReadPacket<T = any> {
  pattern: any
  data: T
}

export interface WritePacket<T = any> {
  err?: any
  response?: T
  isDisposed?: boolean
  status?: string
}

export type OutgoingRequest = ReadPacket & PacketId
export type IncomingRequest = ReadPacket & PacketId
export type OutgoingEvent = ReadPacket
export type IncomingEvent = ReadPacket
export type IncomingResponse = WritePacket & PacketId
export type OutgoingResponse = WritePacket & PacketId

/**
 * @publicApi
 */
export interface Deserializer<TInput = any, TOutput = any> {
  deserialize(value: TInput, options?: Record<string, any>): TOutput | Promise<TOutput>
}

export type ProducerDeserializer = Deserializer<any, IncomingResponse>
export type ConsumerDeserializer = Deserializer<any, IncomingRequest | IncomingEvent>

export interface Serializer<TInput = any, TOutput = any> {
  serialize(value: TInput, options?: Record<string, any>): TOutput
}

export type ProducerSerializer = Serializer<OutgoingEvent | OutgoingRequest, any>
export type ConsumerSerializer = Serializer<OutgoingResponse, any>

export class IdentitySerializer implements Serializer {
  serialize(value: any) {
    return value
  }
}

export type ClientOptions = {
  options?: Record<string, any>
}

/**
 * @publicApi
 */
export interface MessageHandler<TInput = any, TContext = any, TResult = any> {
  (data: TInput, ctx?: TContext): Promise<Observable<TResult>> | Promise<TResult>
  next?: (data: TInput, ctx?: TContext) => Promise<Observable<TResult>> | Promise<TResult>
  isEventHandler?: boolean
  extras?: Record<string, any>
}

export type TransportId = symbol

/**
 * @publicApi
 */
export interface CustomTransportStrategy {
  /**
   * Unique transport identifier.
   */
  transportId?: TransportId
  /**
   * Method called when the transport is being initialized.
   * @param callback Function to be called upon initialization
   */
  listen(callback: (...optionalParams: unknown[]) => any): any
  /**
   * Method called when the transport is being terminated.
   */
  close(): any
}
