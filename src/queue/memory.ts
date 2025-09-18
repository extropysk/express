import { catchError, mergeMap, Subject } from 'rxjs'
import { BaseQueue, BaseWorker, Job, JobData, QueueProvider } from '@/queue/base'

class MemoryQueue<DataType extends JobData> extends BaseQueue<DataType> {
  private subject = new Subject<Job<DataType>>()

  constructor(private name: string) {
    super()
  }

  async add(data: DataType): Promise<void> {
    const job: Job<DataType> = {
      data,
      name: this.name,
    }
    this.subject.next(job)
  }

  get stream() {
    return this.subject.asObservable()
  }
}

export class MemoryQueueProvider extends QueueProvider {
  private queues = new Map<string, MemoryQueue<any>>()

  createQueue<DataType extends JobData>(name: string): BaseQueue<DataType> {
    if (this.queues.has(name)) {
      return this.queues.get(name)!
    }
    const queue = new MemoryQueue<DataType>(name)
    this.queues.set(name, queue)
    return queue
  }

  registerWorker<DataType extends JobData>(worker: BaseWorker<DataType>): void {
    let queue = this.queues.get(worker.resolveName())
    if (!queue) {
      queue = new MemoryQueue<DataType>(worker.resolveName())
      this.queues.set(worker.resolveName(), queue)
    }

    queue.stream
      .pipe(
        mergeMap(async (job: Job<DataType>) => {
          try {
            await worker.process(job.data)
            worker.onCompleted(job)
          } catch (error) {
            worker.onFailed(job, error as Error)
          }
        }),
        catchError((err, caught) => {
          worker.onFailed(undefined, err)
          return caught
        }),
      )
      .subscribe()
  }
}
