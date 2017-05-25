<?php
/**
 * @file
 * Define Hosting service class for SSL.
 */

class hostingService_http_ssl extends hostingService_http_public {

  function load() {
    parent::load();
    $this->mergeData("SELECT ssl_port FROM {hosting_ssl_server} WHERE vid=:vid", array(':vid' => $this->server->vid));
    $this->ssl_enabled = TRUE;
  }

  function insert() {
    parent::insert();
    $id = db_insert('hosting_ssl_server')
      ->fields(array(
        'vid' => $this->server->vid,
        'nid' => $this->server->nid,
        'ssl_port' => $this->ssl_port,
      ))
      ->execute();
  }

  function delete() {
    parent::delete();
    db_delete('hosting_ssl_server')
      ->condition('nid', $this->server->nid)
      ->execute();
  }

  function delete_revision() {
    parent::delete_revision();
    db_delete('hosting_ssl_server')
      ->condition('vid', $this->server->vid)
      ->execute();
  }

  function form(&$form) {
    parent::form($form);

    $form['ssl_port'] = array(
      '#type' => 'textfield',
      '#title' => t('SSL Port'),
      '#required' => !empty($this->available),
      '#size' => 40,
      '#default_value' => isset($this->ssl_port) ? $this->ssl_port : '443',
      '#description' => t("The port that this service will use for encrypted traffic."),
      '#maxlength' => 255,
      '#weight' => -7,
    );
  }

  function view(&$render) {
    parent::view($render);
    $render['ssl_port'] = array(
      '#type' => 'item',
      '#title' => t('SSL Port'),
      '#markup' => filter_xss($this->ssl_port),
    );
  }

  public function validate(&$node, &$form, &$form_state) {
    parent::validate($node, $form, $form_state);
    if ((int) $this->ssl_port <= 0) {
      form_set_error('ssl_port', t("The port you specify must be a number."));
    }
  }

  public function context_options($task_type, $ref_type, &$task) {
    parent::context_options($task_type, $ref_type, $task);
    $task->context_options[$this->service . '_ssl_port'] = $this->ssl_port;
  }

  public function context_import($context) {
    parent::context_import($context);

    $this->ssl_port = $context->http_ssl_port;
  }
  
  public function site_form(&$form, $node) {
    parent::site_form($form, $node);
  
//    $new_site = TRUE;
//    $ssl_available = FALSE;
    // Only allow the user to modify these values when the platform is SSL enabled.
    // @TODO: Remove this, we probably don't need it any more since this method is only invoked if the services are enabled.
//    if (isset($node->nid)) {
//      $new_site = FALSE;
//      $platform = node_load($node->platform);
//      $server = node_load($platform->web_server);
//
//      if ($server->services['http']->ssl_enabled) {
//        $ssl_available = TRUE;
//      }
//    }
//    elseif (count(hosting_ssl_get_servers('http')) > 0) {
//      $ssl_available = TRUE;
//    }
//
  
//    if (!$ssl_available) {
//      return;
//    }
  
    
    // Assume SSL is available and this is not a new site, since our code doesn't support new sites yet.
    $ssl_available = TRUE;
    $new_site = FALSE;
  
    _hosting_site_field($form, $node, 'hosting_ssl_wrapper', array(
      '#type' => 'fieldset',
      '#title' => t('SSL Settings'),
      '#default_value' => NULL,
//      '#parents' => array('hosting_ssl_wrapper'),
    ), 'filter_xss', $ssl_available);
  
    _hosting_site_field($form['hosting_ssl_wrapper'], $node, 'ssl_enabled', array(
      '#type' => 'radios',
      '#title' => t('Encryption'),
      '#options' => hosting_ssl_status_options(),
      '#description' => t('Enabling encryption will publish your site on both HTTP and HTTPS ports, allowing you to redirect users to the more secure version for certain pages that require the additional security. Requiring encryption will automatically redirect all unencrypted traffic to your HTTPS site.'),
      '#required' => TRUE,
      '#default_value' => (isset($node->ssl_enabled)) ? $node->ssl_enabled : HOSTING_SSL_DISABLED,
      '#access' => user_access('create ssl certificate'),
    ), 'hosting_ssl_status_options', $ssl_available);
  
    _hosting_site_field($form['hosting_ssl_wrapper'], $node, 'ssl_key', array(
      '#type' => 'radios',
      '#title' => t('Encryption key'),
      '#description' => t("Choose an existing SSL certificate. If you do not wish to use any of your existing certificates, you may choose to generate a new one."),
      '#options' => hosting_ssl_get_keys(NULL, TRUE),
      '#required' => TRUE,
      '#default_value' => (isset($node->ssl_key) && $node->ssl_key > 0) ? $node->ssl_key : HOSTING_SSL_CUSTOM_KEY,
      '#access' => user_access('create ssl certificate'),
      '#states' => array(
        'visible' => array(
          ':input[name="ssl_enabled"]' => array('!value' => 0),
        ),
      ),
    ), 'hosting_ssl_output_key', $ssl_available, !$new_site);
  
    _hosting_site_field($form['hosting_ssl_wrapper'], $node, 'ssl_key_new', array(
      '#type' => 'textfield',
      '#title' => t('New encryption key'),
      '#description' => t("A name for the certificate, often relating to the domain name. This field should only contain lower case alpha-numeric and '_', '-' or '.' characters. If the SSL certificate is not found in config/ssl.d, Aegir will automatically generate a self-signed certificate for you. You can replace the generated with a properly signed version later. Any required intermediate certificates can be added in a file called config/ssl.d/&lt;name&gt;/openssl_chain.crt"),
      '#default_value' => '',
      '#access' => user_access('create ssl certificate'),
      '#states' => array(
        'visible' => array(
          ':input[name="ssl_enabled"]' => array('!value' => 0),
          ':input[name="ssl_key"]' => array('value' => HOSTING_SSL_CUSTOM_KEY),
        ),
      ),
    ), 'filter_xss', $ssl_available, FALSE);
  }
}

class hostingService_http_apache_ssl extends hostingService_http_ssl {
  public $type = 'apache_ssl';
  public $name = 'Apache SSL';

  protected $has_restart_cmd = TRUE;

  function default_restart_cmd() {
    $command = '/usr/sbin/apachectl'; # a proper default for most of the world
    foreach (explode(':', $_SERVER['PATH']) as $path) {
      $options[] = "$path/apache2ctl";
      $options[] = "$path/apachectl";
    }
    # try to detect the apache restart command
    $options[] = '/usr/local/sbin/apachectl'; # freebsd
    $options[] = '/usr/sbin/apache2ctl'; # debian + apache2
    $options[] = $command;

    foreach ($options as $test) {
      if (is_executable($test)) {
        $command = $test;
        break;
      }
    }

    return "sudo $command graceful";
  }

}


