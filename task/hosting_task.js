(function($) {

hostingTaskRefreshList = function() {
  if (!Drupal.settings.hostingTaskRefresh.nid) {
    return null;
  }

  var hostingTaskListRefreshCallback = function(data, responseText) {
    // If the node has been modified, reload the whole page.
    if (Drupal.settings.hostingTaskRefresh.changed < data.changed) {
      // only reload if there is no modal frame currently open
      if ($(document).data('hostingOpenModalFrame') != true) {
        // If a specific URL was specified, go there.
        if (data.navigate_url) {
          document.location = data.navigate_url;
        }
        // Fall back to just doing a reload of the current page.
        else {
          document.location.reload();
        }
      }
    }
    else {
      $("#hosting-task-list").html(data.markup);

      hostingTaskBindButtons('#hosting-task-list');
      setTimeout("hostingTaskRefreshList()", Drupal.settings.hostingTaskRefresh.refreshRate * 1000 );
    }
  }

  hostingTaskAddOverlay('#hosting-task-list');
  $.get(Drupal.settings.basePath + 'hosting/tasks/' + Drupal.settings.hostingTaskRefresh.nid + '/list', null, hostingTaskListRefreshCallback , 'json' );
}


function hostingTaskAddOverlay(elem) {
  $(elem).prepend('<div class="hosting-overlay"><div class="hosting-throbber"></div></div>');
}


hostingTaskRefreshQueueBlock = function(latestTimestamp, tasksOutstanding) {
  // This function only applies to the queue block.
  if (Drupal.settings.hostingTaskRefresh.queueBlock != 1) {
    return null;
  }

  var hostingTaskQueueRefreshCallback = function(data, responseText) {
    // Update the queue block content.
    $("#block-views-hosting-task-list-block .content").html(data.markup);

    // Allow buttons to open modal dialogs.
    hostingTaskBindButtons('#block-views-hosting-task-list-block');
    // Trigger this parent function again re-using the current data.
    setTimeout(function() { hostingTaskRefreshQueueBlock(latestTimestamp, tasksOutstanding) }, 1000 );
  }

  var hostingTaskQueuePollCallback = function(data) {
    // Update the polling frequency based on the latest status.
    pollTimeout = data.outstanding ? 1000 : Drupal.settings.hostingTaskRefresh.refreshRate * 1000;
    //debug
    console.log(data.timestamp + ' :: ' + latestTimestamp);
    // Refresh the queue block whenever the latest status changes.
    if (data.timestamp > latestTimestamp) {
      // Update the timestamp
      // @todo: is this really req'd?
      latestTimestamp = data.timestamp;
      // Add throbber overlay to indicate that a refresh is in progress.
      hostingTaskAddOverlay('#block-views-hosting-task-list-block .view-content');
      // Request the updated queue block and pass the result to the callback for appropriate action.
      $.get(Drupal.settings.basePath + 'hosting/tasks/queue', null, hostingTaskQueueRefreshCallback , 'json');
    }
    // Trigger the parent function again using the latest data.
    setTimeout(function() { hostingTaskRefreshQueueBlock(data.timestamp, data.outstanding) }, pollTimeout );
  }

  // Poll the latest status and pass the result to the callback for appropriate action.
  $.get(Drupal.settings.basePath + 'js/hosting_task/latest/status', null, hostingTaskQueuePollCallback, 'json');

}

$(document).ready(function() {
  $(document).data('hostingOpenModalFrame', false);
  // Initialize our polling parameters from data passed in from Drupal.
  var latestTimestamp = Drupal.settings.hostingTaskRefresh.latestTimestamp;
  var tasksOutstanding = Drupal.settings.hostingTaskRefresh.tasksOutstanding;
  // Set fast polling when outstanding tasks exist, otherwise use our configured refresh rate.
  pollTimeout = tasksOutstanding ? 1000 : Drupal.settings.hostingTaskRefresh.refreshRate * 1000;
  setTimeout("hostingTaskRefreshList()", pollTimeout );
  setTimeout(function() { hostingTaskRefreshQueueBlock(latestTimestamp, tasksOutstanding) }, pollTimeout );
  hostingTaskBindButtons($(this));
  $('#hosting-task-confirm-form-actions a').click(function() {
    if (parent.Drupal.modalFrame.isOpen) {
      setTimeout(function() { parent.Drupal.modalFrame.close({}, {}); }, 1);
      return false;
    }
  });

});

hostingTaskBindButtons = function(elem) {
  $('.hosting-button-dialog', elem).click(function() {
      $(document).data('hostingOpenModalFrame', true)
     var options = {
        url : Drupal.settings.basePath + 'hosting/js' + $(this).attr('href'),
        draggable : false,
        width : 600,
        height : 150,
        onSubmit : function() {
          $(document).data('hostingOpenModalFrame', false)
          hostingTaskRefreshQueueBlock();
          hostingTaskRefreshList();
        }
      }
      Drupal.modalFrame.open(options);
      return false;
   });
}


})(jQuery);
