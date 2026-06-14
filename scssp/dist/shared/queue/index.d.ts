import { Queue, Worker } from 'bullmq';
export declare function getQueue(name: string): Queue;
export declare function createWorker(name: string, processor: (job: any) => Promise<void>): Worker;
export declare function closeAllQueues(): Promise<void>;
//# sourceMappingURL=index.d.ts.map