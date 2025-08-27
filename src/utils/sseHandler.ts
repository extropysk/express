import type { Response, Request as ExpressRequest } from 'express'
import { catchError, concatMap, EMPTY, Observable } from 'rxjs'
import { SseStream, MessageEvent } from './sse'

export const sseHandler =
  (observable: Observable<MessageEvent>) => (req: ExpressRequest, res: Response) => {
    const stream = new SseStream(req)
    stream.pipe(res)

    const subscription = observable
      .pipe(
        concatMap(
          message => new Promise<void>(resolve => stream.writeMessage(message, () => resolve())),
        ),
        catchError(err => {
          const data = err instanceof Error ? err.message : err
          stream.writeMessage({ type: 'error', data }, writeError => {
            if (writeError) {
              console.error(writeError)
            }
          })

          return EMPTY
        }),
      )
      .subscribe({
        complete: () => {
          res.end()
        },
      })

    res.on('close', () => {
      subscription.unsubscribe()
      if (!stream.writableEnded) {
        stream.end()
      }
    })
  }
