type Obj = Record<string, unknown>

class ExtendableError<TData extends Obj = Obj> extends Error {
  data: TData
  isPublic: boolean
  status: number

  constructor(message: string, status: number, data: TData, isPublic: boolean) {
    super(message)

    this.status = status
    this.data = data
    this.isPublic = isPublic
  }
}

export class ApiError extends ExtendableError {
  constructor(key: string, data: Obj = {}, status = 400) {
    super(key, status, data, true)
  }
}

export class CustomError<TData extends Obj = Obj> extends Error {
  readonly data?: TData
  readonly innerError?: Error

  public constructor(message: string, error?: unknown, data?: TData) {
    super(message)

    // Required: restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype)

    this.name = 'CustomError'
    this.innerError = error as Error
    this.data = data

    // Preserve stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}
