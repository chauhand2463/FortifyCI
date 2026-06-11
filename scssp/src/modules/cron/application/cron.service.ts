import { getLogger } from '@shared/utils/logger';
import { assignmentService } from '@modules/assignment/application/assignment.service';
import { exceptionService } from '@modules/exception/application/exception.service';
import { nvdService } from '@modules/nvd-watch/application/nvd.service';

const logger = getLogger();

let cronInterval: NodeJS.Timeout | null = null;

async function processSlaBreaches(): Promise<void> {
  try {
    const count = await assignmentService.processSlaBreaches();
    if (count > 0) logger.info({ count }, 'SLA breaches processed');
  } catch (error: any) {
    logger.error({ err: error.message }, 'SLA breach cron failed');
  }
}

async function processExpiredExceptions(): Promise<void> {
  try {
    const count = await exceptionService.processExpiredExceptions();
    if (count > 0) logger.info({ count }, 'Expired exceptions processed');
  } catch (error: any) {
    logger.error({ err: error.message }, 'Exception expiry cron failed');
  }
}

async function syncNvd(): Promise<void> {
  try {
    await nvdService.sync();
  } catch (error: any) {
    logger.error({ err: error.message }, 'NVD sync cron failed');
  }
}

export async function startCronJobs(): Promise<void> {
  logger.info('Starting cron jobs');

  await processSlaBreaches();
  await processExpiredExceptions();

  const SLA_BREACH_INTERVAL = 60 * 60 * 1000;
  const EXCEPTION_EXPIRY_INTERVAL = 60 * 60 * 1000;
  const NVD_SYNC_INTERVAL = 6 * 60 * 60 * 1000;

  setInterval(processSlaBreaches, SLA_BREACH_INTERVAL);
  setInterval(processExpiredExceptions, EXCEPTION_EXPIRY_INTERVAL);
  setInterval(syncNvd, NVD_SYNC_INTERVAL);

  logger.info('Cron jobs scheduled');
}

export function stopCronJobs(): void {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
  }
}
