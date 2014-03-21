(function($) {

hostingTaskRefreshList = function(latestVid, tasksOutstanding) {
  // This function only applies to the node task list.
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
      // Update the task list content.
      $("#hosting-task-list").html(data.markup);

      // Allow buttons to open modal dialogs.
      hostingTaskBindButtons('#hosting-task-list');
      // Trigger this parent function again re-using the current data.
      setTimeout(function() { hostingTaskRefreshList(latestVid, statusChanged) }, Drupal.settings.hostingTaskRefresh.busyPollRate );
    }
  }

  var hostingTaskListPollCallback = function(data) {
    // Initilize a variable that will persist across calls to the parent function.
    if (typeof(statusChanged) == 'undefined') { statusChanged = false; }
    // Update the polling frequency based on the latest status.
    pollTimeout = data.outstanding || statusChanged ? Drupal.settings.hostingTaskRefresh.busyPollRate : Drupal.settings.hostingTaskRefresh.idlePollRate;
    // Keep track of when the status has changed across calls to the parent function.
    statusChanged = data.outstanding != tasksOutstanding;
    // Refresh the queue block whenever the latest status changes.
    if (data.vid > latestVid) {
      // Update the parameters
      latestVid = data.vid;
      tasksOutstanding = data.outstanding;
      // Add throbber overlay to indicate that a refresh is in progress.
      hostingTaskAddOverlay('#hosting-task-list');
      // Request the updated queue block and pass the result to the callback for appropriate action.
      $.get(Drupal.settings.basePath + 'hosting/tasks/' + Drupal.settings.hostingTaskRefresh.nid + '/list', null, hostingTaskListRefreshCallback , 'json' );
    }
    // Trigger the parent function again.
    setTimeout(function() { hostingTaskRefreshList(latestVid, tasksOutstanding) }, pollTimeout );
  }

  // Poll the latest status and pass the result to the callback for appropriate action.
  $.get(Drupal.settings.basePath + 'js/hosting_task/list_status/' + Drupal.settings.hostingTaskRefresh.nid, null, hostingTaskListPollCallback, 'json');

}


function hostingTaskAddOverlay(elem) {
  $(elem).prepend('<div class="hosting-overlay"><div class="hosting-throbber"></div></div>');
}


hostingTaskRefreshQueueBlock = function(latestVid, tasksOutstanding) {
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
    setTimeout(function() { hostingTaskRefreshQueueBlock(latestVid, statusChanged) }, Drupal.settings.hostingTaskRefresh.busyPollRate );
  }

  var hostingTaskQueuePollCallback = function(data) {
    // Initilize a variable that will persist across calls to the parent function.
    if (typeof(statusChanged) == 'undefined') { statusChanged = false; }
    // Update the polling frequency based on the latest status.
    pollTimeout = data.outstanding || statusChanged ? Drupal.settings.hostingTaskRefresh.busyPollRate : Drupal.settings.hostingTaskRefresh.idlePollRate;
    // Keep track of when the status has changed across calls to the parent function.
    statusChanged = data.outstanding != tasksOutstanding;
    // Refresh the queue block whenever the latest status changes.
    if (data.vid > latestVid) {
      // Update the parameters
      latestVid = data.vid;
      tasksOutstanding = data.outstanding;
      // Add throbber overlay to indicate that a refresh is in progress.
      hostingTaskAddOverlay('#block-views-hosting-task-list-block .view-content');
      // Request the updated queue block and pass the result to the callback for appropriate action.
      $.get(Drupal.settings.basePath + 'hosting/tasks/queue', null, hostingTaskQueueRefreshCallback , 'json');
    }
    // Trigger the parent function again.
    setTimeout(function() { hostingTaskRefreshQueueBlock(latestVid, tasksOutstanding) }, pollTimeout );
  }

  // Poll the latest status and pass the result to the callback for appropriate action.
  $.get(Drupal.settings.basePath + 'js/hosting_task/queue_status', null, hostingTaskQueuePollCallback, 'json');

}

$(document).ready(function() {
  if (typeof(Drupal.settings.hostingTaskRefresh) != 'undefined') {
    $(document).data('hostingOpenModalFrame', false);

    // Initialize our polling parameters from data passed in from Drupal.
    var latestVid = Drupal.settings.hostingTaskRefresh.latestVid;
    var tasksOutstanding = Drupal.settings.hostingTaskRefresh.tasksOutstanding;

    var hostingTaskSetTimeouts = function(){
      // Set fast polling when outstanding tasks exist, otherwise use our configured refresh rate.
      pollTimeout = tasksOutstanding ? Drupal.settings.hostingTaskRefresh.busyPollRate : Drupal.settings.hostingTaskRefresh.idlePollRate;
      setTimeout(function() { hostingTaskRefreshList(latestVid, tasksOutstanding) }, pollTimeout );
      setTimeout(function() { hostingTaskRefreshQueueBlock(latestVid, tasksOutstanding) }, pollTimeout );
    }

    hostingTaskSetTimeouts();

    hostingTaskBindButtons($(this));
    $('#hosting-task-confirm-form-actions a').click(function() {
      if (parent.Drupal.modalFrame.isOpen) {
        setTimeout(function() { parent.Drupal.modalFrame.close({}, {}); }, 1);
        return false;
      }
    });

    $(document).bind("ajaxComplete", function(){
      if (Drupal.settings.hostingTaskRefresh.latestVid > latestVid) {
        // Update our parameters with data passed in with the AJAX request.
        latestVid = Drupal.settings.hostingTaskRefresh.latestVid;
        tasksOutstanding = Drupal.settings.hostingTaskRefresh.tasksOutstanding;
        hostingTaskSetTimeouts();
      }
    });
  }
});

hostingTaskBindButtons = function(elem) {
  $('.hosting-button-dialog', elem).click(function() {
    $(document).data('hostingOpenModalFrame', true);
    var options = {
      url : Drupal.settings.basePath + 'hosting/js' + $(this).attr('href'),
      draggable : false,
      width : 600,
      height : 150,
      onSubmit : function() {
        $(document).data('hostingOpenModalFrame', false);
        latestVid = Drupal.settings.hostingTaskRefresh.latestVid;
        tasksOutstanding = Drupal.settings.hostingTaskRefresh.tasksOutstanding;
        hostingTaskRefreshQueueBlock(latestVid, tasksOutstanding);
        hostingTaskRefreshList(latestVid, tasksOutstanding);
      }
    }
    Drupal.modalFrame.open(options);
    return false;
  });
}


})(jQuery);
