import { Logger } from '@/types'

export interface JobData {
  name: string
}

export interface Job<DataType> {
  data: DataType
  name: string
}

export abstract class BaseQueue<DataType extends JobData> {
  abstract add(data: DataType): Promise<void>
}

export abstract class BaseWorker<DataType extends JobData> {
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
  abstract createQueue<DataType extends JobData>(name: string): BaseQueue<DataType>
  abstract registerWorker<DataType extends JobData>(worker: BaseWorker<DataType>): void

  createQueues<T extends Record<string, any> = Record<string, any>>(
    names: readonly (keyof T)[],
  ): { [K in keyof T]: BaseQueue<T[K]> } {
    return names.reduce(
      (acc, name) => {
        acc[name] = this.createQueue<T[typeof name]>(name as string)
        return acc
      },
      {} as { [K in keyof T]: BaseQueue<T[K]> },
    )
  }
}
