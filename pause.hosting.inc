<?php

/**
 * @file
 * Drush include for the Hosting module's hosting pause command.
 */

/**
 * Make sure Aegir is ready to be upgraded.
 */
function drush_hosting_pause_validate($url) {
  // Wait for the task queue to complete.
  while (hosting_task_count_running() > 0) {
    drush_log(dt('Waiting for the task queue to be processed and tasks to complete.'), 'notice');
    sleep(1);
  }
}

/**
 * Drush command to pause the Aegir frontend queues.
 *
 * This is really just deleting our code from the crontab.
 */
function drush_hosting_pause($url) {
  // Wipe out cron entry.
  _hosting_setup_cron($add = FALSE);
}
