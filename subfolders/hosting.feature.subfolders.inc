<?php
/**
 * @file
 *   Expose the subfolders feature to hostmaster.
 */

/**
 * Implementation of hook_hosting_feature().
 */
function hosting_subfolders_hosting_feature() {
  $features['subfolders'] = array(
    'title' => t('Site subfolders'),
    'description' => t('Subfolder multisite support.'),
    'status' => HOSTING_FEATURE_ENABLED,
    'module' => 'hosting_subfolders',
    'group' => 'experimental'
    );
  return $features;
}

