// Purpose: send legacy Tickets and Contact URLs to their combined pages without losing event selections.
'use strict';

// Redirects a legacy page using its fixed local destination; takes no inputs and returns no value.
// replace() keeps the Back button useful; a visible HTML link remains available without JavaScript.
function redirectLegacyPage() {
  const link = document.getElementById('merged-page-link');
  const destination = new URL(link.getAttribute('href'), window.location.href);
  destination.search = window.location.search;
  window.location.replace(destination.href);
}

redirectLegacyPage();
