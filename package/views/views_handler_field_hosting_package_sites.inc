<?php

class views_handler_field_hosting_package_sites extends views_handler_field {
  function render($values) {
    $package = $values->{$this->field_alias};
    $platform = $this->view->args[0];
    return hosting_package_count_sites($package, $platform);
  }
}

