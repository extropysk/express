import {
  ConsumerDeserializer,
  IncomingEvent,
  IncomingRequest,
  IncomingResponse,
  ProducerDeserializer,
} from '../interfaces'
import { isUndefined } from '../../utils'

/**
 * @publicApi
 */
export class IncomingResponseDeserializer implements ProducerDeserializer {
  deserialize(value: any, _options?: Record<string, any>): IncomingResponse {
    return this.isExternal(value) ? this.mapToSchema(value) : value
  }

  isExternal(value: any): boolean {
    if (!value) {
      return true
    }
    if (
      !isUndefined((value as IncomingResponse).err) ||
      !isUndefined((value as IncomingResponse).response) ||
      !isUndefined((value as IncomingResponse).isDisposed)
    ) {
      return false
    }
    return true
  }

  mapToSchema(value: any): IncomingResponse {
    return {
      id: value && value.id,
      response: value,
      isDisposed: true,
    }
  }
}

/**
 * @publicApi
 */
export class IncomingRequestDeserializer implements ConsumerDeserializer {
  deserialize(value: any, options?: Record<string, any>): IncomingRequest | IncomingEvent {
    return this.isExternal(value) ? this.mapToSchema(value, options) : value
  }

  isExternal(value: any): boolean {
    if (!value) {
      return true
    }
    if (
      !isUndefined((value as IncomingRequest).pattern) ||
      !isUndefined((value as IncomingRequest).data)
    ) {
      return false
    }
    return true
  }

  mapToSchema(value: any, options?: Record<string, any>): IncomingRequest | IncomingEvent {
    if (!options) {
      return {
        pattern: undefined,
        data: undefined,
      }
    }
    return {
      pattern: options.channel,
      data: value,
    }
  }
}
