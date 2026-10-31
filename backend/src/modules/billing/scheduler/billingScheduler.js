const cron = require('node-cron');
const { executeBillingRun } = require('../services/recurringBillingEngine');

let cronJob = null;
let isRunInProgress = false;

const getSchedulerConfig = () => {
  return {
    enabled: process.env.BILLING_SCHEDULER_ENABLED === 'true',
    cronExpression: process.env.BILLING_CRON_EXPRESSION || '0 0 * * *',
    timezone: process.env.BILLING_TIMEZONE || 'Asia/Kolkata'
  };
};

/**
 * Initializes and starts the recurring billing cron scheduler
 */
const startBillingScheduler = () => {
  const config = getSchedulerConfig();

  if (!config.enabled) {
    console.log('[BillingScheduler] Automated cron scheduler disabled by configuration (BILLING_SCHEDULER_ENABLED != true)');
    return null;
  }

  if (cronJob) {
    console.log('[BillingScheduler] Cron scheduler already active');
    return cronJob;
  }

  // Validate cron expression
  if (!cron.validate(config.cronExpression)) {
    console.error(`[BillingScheduler] Invalid cron expression: "${config.cronExpression}"`);
    return null;
  }

  console.log(`[BillingScheduler] Initializing automated scheduler: "${config.cronExpression}" (Timezone: ${config.timezone})`);

  cronJob = cron.schedule(
    config.cronExpression,
    async () => {
      if (isRunInProgress) {
        console.warn('[BillingScheduler] Skipping scheduled tick: Previous billing run still in progress (Overlap prevention lock engaged)');
        return;
      }

      isRunInProgress = true;
      console.log(`[BillingScheduler] Starting automated billing run at ${new Date().toISOString()}...`);

      try {
        const result = await executeBillingRun({
          triggerType: 'scheduled',
          triggeredBy: 'system_cron_scheduler'
        });
        console.log(`[BillingScheduler] Completed run ${result.billingRun.runReference}: ${result.billingRun.summary}`);
      } catch (err) {
        console.error('[BillingScheduler] Scheduled billing run failed with error:', err.message);
      } finally {
        isRunInProgress = false;
      }
    },
    {
      timezone: config.timezone
    }
  );

  return cronJob;
};

/**
 * Stops the recurring billing scheduler
 */
const stopBillingScheduler = () => {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[BillingScheduler] Automated cron scheduler stopped');
  }
};

/**
 * Inspect scheduler state
 */
const getSchedulerState = () => {
  const config = getSchedulerConfig();
  return {
    isRunning: Boolean(cronJob),
    isJobInProgress: isRunInProgress,
    ...config
  };
};

module.exports = {
  startBillingScheduler,
  stopBillingScheduler,
  getSchedulerState
};
