import { Logger } from '@/types'

interface Data {
  name: string
}

interface Job<DataType> {
  data: DataType
  name: string
}

export abstract class BaseQueue<DataType extends Data> {
  abstract add(data: DataType): Promise<void>
}

export abstract class BaseWorker<DataType extends Data> {
  constructor(private logger: Logger) {}

  onCompleted(job: Job<DataType>) {
    this.logger.debug(`${this.resolveName()} worker: Job ${job.name} completed.`)
  }
  onFailed(job?: Job<DataType>, error?: Error) {
    this.logger.error(
      `${this.resolveName()} worker: Job ${job?.name} failed. ${error?.message}\n${error?.stack}`,
    )
  }

  abstract process(data: DataType): Promise<void>

  abstract resolveName(): string
}

export abstract class QueueProvider {
  abstract createQueue<DataType extends Data>(name: string): BaseQueue<DataType>
  abstract registerWorker<DataType extends Data>(worker: BaseWorker<DataType>): void
}
