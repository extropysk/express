import { Access, PayloadRequest } from '@/types'

import type z from 'zod'
import type { Response } from 'express'

import { ZodError } from 'zod'
import { ApiError } from '@/errors'
import { AwilixContainer } from 'awilix'

type ParsedQs = Record<string, string>

interface BaseRequest<U> extends PayloadRequest<U> {
  container: AwilixContainer
}

export interface Request<B = any, Q extends ParsedQs = ParsedQs, U = any> extends BaseRequest<U> {
  body: B
  query: Q
}

interface Options<
  BSchema extends z.ZodTypeAny | undefined = undefined,
  QSchema extends z.ZodTypeAny | undefined = undefined,
> {
  access?: Access
  querySchema?: QSchema
  schema?: BSchema
}

export function handler<
  BSchema extends z.ZodTypeAny | undefined = undefined,
  QSchema extends z.ZodTypeAny | undefined = undefined,
  U = any,
  R = unknown,
>(
  callback: (
    req: Request<
      BSchema extends z.ZodTypeAny ? z.infer<BSchema> : unknown,
      QSchema extends z.ZodTypeAny ? z.infer<QSchema> : ParsedQs,
      U
    >,
  ) => Promise<R>,
  { access, querySchema, schema }: Options<BSchema, QSchema> = {},
) {
  return async (req: PayloadRequest, res: Response) => {
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
        req.query = querySchema.parse(req.query)
      }

      if (schema) {
        req.body = schema.parse(req.body)
      }

      const typedReq = req as Request<
        BSchema extends z.ZodTypeAny ? z.infer<BSchema> : unknown,
        QSchema extends z.ZodTypeAny ? z.infer<QSchema> : ParsedQs,
        U
      >
      const data = await callback(typedReq)
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
