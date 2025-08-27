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
