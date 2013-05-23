<?php

/**
 * Implementation of hook_hosting_site_context_options().
 */
function hosting_subfolders_hosting_site_context_options(&$task) {
  if (isset($task->ref->subfolder_path)) {
    $task->context_options['subfolder_path'] = $task->ref->subfolder_path;
  }
}

/**
 * Implementation of hook_drush_context_import().
 */
function hosting_subfolders_drush_context_import($context, &$node) {
  if ($context->type == 'site') {
    if (isset($context->subfolder_path)) {
      $node->subfolder_path = $context->subfolder_path;
    }
  }

}
