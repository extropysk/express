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
