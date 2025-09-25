import type { NextFunction, Response } from 'express'
import { AwilixContainer } from 'awilix'

export const injectContainer = (container: AwilixContainer) => {
  return (req: any, _res: Response, next: NextFunction) => {
    req.container = container.createScope()

    return next()
  }
}
