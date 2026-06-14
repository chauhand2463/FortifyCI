"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = startCronJobs;
exports.stopCronJobs = stopCronJobs;
const logger_1 = require("@shared/utils/logger");
const assignment_service_1 = require("@modules/assignment/application/assignment.service");
const exception_service_1 = require("@modules/exception/application/exception.service");
const nvd_service_1 = require("@modules/nvd-watch/application/nvd.service");
const logger = (0, logger_1.getLogger)();
let cronInterval = null;
async function processSlaBreaches() {
    try {
        const count = await assignment_service_1.assignmentService.processSlaBreaches();
        if (count > 0)
            logger.info({ count }, 'SLA breaches processed');
    }
    catch (error) {
        logger.error({ err: error.message }, 'SLA breach cron failed');
    }
}
async function processExpiredExceptions() {
    try {
        const count = await exception_service_1.exceptionService.processExpiredExceptions();
        if (count > 0)
            logger.info({ count }, 'Expired exceptions processed');
    }
    catch (error) {
        logger.error({ err: error.message }, 'Exception expiry cron failed');
    }
}
async function syncNvd() {
    try {
        await nvd_service_1.nvdService.sync();
    }
    catch (error) {
        logger.error({ err: error.message }, 'NVD sync cron failed');
    }
}
async function startCronJobs() {
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
function stopCronJobs() {
    if (cronInterval) {
        clearInterval(cronInterval);
        cronInterval = null;
    }
}
//# sourceMappingURL=cron.service.js.map