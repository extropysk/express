export class RuntimeException extends Error {
  constructor(message = ``) {
    super(message)
  }

  public what() {
    return this.message
  }
}

export class InvalidMessageException extends RuntimeException {
  constructor() {
    super(`The invalid data or message pattern (undefined/null)`)
  }
}
