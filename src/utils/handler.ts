import { ParsedQs } from 'qs'
import { Access, PayloadRequest } from '../types'
import type z from 'zod'
import type { Response } from 'express'
import { ApiError } from '../errors'
import { ZodError } from 'zod'

interface Request<B, Q extends ParsedQs = ParsedQs, U = any> extends PayloadRequest<U> {
  body: B
  query: Q
}

type Callback<B, Q extends ParsedQs, U, R> = (req: Request<B, Q, U>) => Promise<R>

interface Options {
  access?: Access
  querySchema?: z.AnyZodObject
  schema?: z.AnyZodObject
}

export const handler = <B, Q extends ParsedQs = ParsedQs, U = any, R = unknown>(
  callback: Callback<B, Q, U, R>,
  { access, querySchema, schema }: Options = {},
) => {
  return async (req: Request<B, Q, U>, res: Response) => {
    const id = req.params.id

    try {
      if (access) {
        if (!req.user) {
          throw new ApiError('unauthorized', undefined, 401)
        }
        if ((await access({ id, req })) === false) {
          throw new ApiError('forbidden', undefined, 403)
        }
      }

      if (querySchema) {
        req.query = querySchema.parse(req.query) as Q
      }

      if (schema) {
        req.body = schema.parse(req.body) as B
      }

      const data = await callback(req)
      res.json(data)
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({ errors: error.issues })
      } else if (error instanceof ApiError) {
        res.status(error.status).json({ message: error.message })
      } else {
        const status = error.status ?? 500
        const message = error.isPublic && error.message ? error.message : 'Internal Server Error'
        res.status(status).json({ message })
      }
    }
  }
}
