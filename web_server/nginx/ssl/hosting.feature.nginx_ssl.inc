<?php
/**
 * @file
 * Register the NGINX SSL Hosting feature.
 */

/**
 * Implements hook_hosting_feature().
 */
function hosting_nginx_ssl_hosting_feature() {
  $features['nginx_ssl'] = array(
    'title' => t('Nginx SSL support'),
    'description' => t('Provide support for the NGINX web server with SSL functionality. (LEGACY, see hosting_https)'),
    'status' => HOSTING_FEATURE_DISABLED,
    'module' => 'hosting_nginx_ssl',
    'group' => 'optional',
  );
  return $features;
}
