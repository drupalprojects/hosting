'Sites in subfolders' support for Aegir.
---------------------------------------

This is really ugly, but it works and doesn't require any use of mod_proxy that would otherwise double-up requests.

Installation instructions
-------------------------

Move provision_subfolders to /var/aegir/.drush/

Move hosting_subfolders to somewhere like /var/aegir/hostmaster-6.x-1.x/sites/all/yoursite/modules/

Enable the 'Hosting subfolders' module at yoursite.com/admin/build/modules/

IMPORTANT: If you use the 'Clone' feature, patch your provision/platform/clone.provision.inc as per the clone.provision.inc.patch

Usage instructions
------------------

1. Go to /node/add/site/ and give your site some unique main URL as always (can be a dummy URL that doesn't even resolve in DNS, if you want)

2. Specify a 'subfolder'. No opening or trailing slashes

3. You *must* give your site a site URL Alias via the 'Site aliases' feature, that is consistent with the multisite/subfolder instructions for Drupal.
(e.g for example.com/foobar, add an alias of example.com.foobar)


Caveats
-------

Main vhost
==========

I'm presuming you've picked some 'main' URL that you want your sites to be a subfolder of, e.g 'example.com'

This 'example.com' must exist as a vhost on your server somewhere, e.g be a Drupal site already, or even something as small as this in your /etc/apache2/conf.d/example.com.conf:

<VirtualHost *:80>
  ServerName example.com
</VirtualHost>

If you don't have a valid 'ServerName' vhost for this site on the server, then you'll get 404s for your subsites due to this line in /var/aegir/config/server_master/apache.conf:

<VirtualHost *:80>
  ServerName default
  Redirect 404 /
</VirtualHost>

So add a vhost, or comment out the 'Redirect 404 /' here.


Nginx
=====

This Aegir extension does not support Nginx at all, at this stage.


Existing platforms
===================

If you want to start using subfolders on any *existing* platforms in your Aegir system, even if you haven't created the site yet, you have to re-verify the platform first. This is
because the platform-wide apache config needs to be modified slightly to include some stub Rewrite rules (*before* the .htaccess is read in).

Renaming sites
==============

Currently there's probably no support for renaming the subfolder when you rename (migrate) a site.
When renaming the subfolder when editing the site node, the old subfolder is kept in the stub files and would need to be removed manually.

Cloning sites
=============

The 'Clone' feature of Aegir loads the *existing* site's context and its properties in order to save a new copy of it with a new name/platform if relevant.

This means it will try and save the new site's context with the same subfolder path as the old site, resulting in that new site hijacking the /subsite (in terms of database credentials) from the old.

To workaround this, you currently need to patch Aegir core (specifically the provision/platform/clone.provision.inc file), with the patch provided in this git repository.


@TODO
-----

Add support for renaming the subfolder when a site is renamed, or get to set a new subfolder for a site that is going to be cloned
  - Will also need to delete the old subfolder stub files when it's renamed, so have a concept of 'old' subfolder name vs 'new'.

Nginx support

Autocomplete the subfolder name based on the first part of the subdomain name, and autocomplete the 'example.com.prefix' Site Alias too.

Fix the clone problem - might need a fix in Aegir itself so that contrib modules can 'hook' into setting or resetting contexts at the right time during the clone process..
