import { BaseWorker } from '@/queue/base'
import { MemoryQueueProvider } from '@/queue/memory'
import { Logger } from '@/types/logger'
import { describe, it, expect, vi } from 'vitest'

const logger: Logger = {
  debug: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  trace: vi.fn(),
  silent: vi.fn(),
  level: 'debug',
}

interface TestData {
  name: string
}

class TestWorker extends BaseWorker<TestData> {
  constructor(
    logger: Logger,
    private processFn: (data: TestData) => Promise<void>,
  ) {
    super(logger)
  }

  async process(data: TestData): Promise<void> {
    return this.processFn(data)
  }

  resolveName(): string {
    return 'test-queue'
  }
}

describe('MemoryQueueProvider', () => {
  it('should process a job successfully', async () => {
    const provider = new MemoryQueueProvider()
    const worker = new TestWorker(logger, vi.fn().mockResolvedValue(undefined))

    provider.registerWorker(worker)
    const queue = provider.createQueue<TestData>('test-queue')

    await queue.add({ name: 'job-1' })

    await new Promise(res => setTimeout(res, 10)) // wait for async

    expect(worker['logger'].debug).toHaveBeenCalledWith(
      expect.stringContaining('test-queue worker: Job test-queue completed.'),
    )
  })

  it('should handle job failure', async () => {
    const provider = new MemoryQueueProvider()
    const error = new Error('boom')
    const worker = new TestWorker(logger, vi.fn().mockRejectedValue(error))

    provider.registerWorker(worker)
    const queue = provider.createQueue<TestData>('test-queue')

    await queue.add({ name: 'job-2' })

    await new Promise(res => setTimeout(res, 10)) // wait for async

    expect(worker['logger'].error).toHaveBeenCalledWith(
      expect.stringContaining('test-queue worker: Job test-queue failed. boom'),
    )
  })

  it('should auto-create queue when registering worker', async () => {
    const provider = new MemoryQueueProvider()
    const worker = new TestWorker(logger, vi.fn().mockResolvedValue(undefined))

    provider.registerWorker(worker)

    // Queue should exist after registering
    const queue = provider.createQueue<TestData>('test-queue')
    expect(queue).toBeDefined()
  })
})
