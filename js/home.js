// Purpose: load editable Home content and update the event countdown without dependencies.
'use strict';

// Converts an event date string and current milliseconds into readable countdown text.
// A confirmed time is required before we can promise an exact countdown.
function countdownText(start, now) {
  const remaining = new Date(start).getTime() - now;
  if (!Number.isFinite(remaining)) {
    return 'Event time to be confirmed';
  }
  if (remaining <= 0) {
    return 'The event date has arrived — check with organisers for updates.';
  }
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor(remaining / 3600000) % 24;
  const minutes = Math.floor(remaining / 60000) % 60;
  return days + ' days · ' + hours + ' hours · ' + minutes + ' minutes to go';
}

// Places the next event into HTML; returns nothing. Generic fallback copy never shows stale sample details.
function showEvent(event) {
  document.getElementById('event-title').textContent = event.title;
  document.getElementById('event-description').textContent = event.description;
  document.getElementById('event-venue').textContent = event.venue;
  const date = new Date(event.countdownDate);
  document.getElementById('event-date').textContent = date.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'
  }).toUpperCase() + ' · ' + (event.startTime ? new Date(event.startTime).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit'
  }) + ' IST' : 'TIME TO BE CONFIRMED');
  const tier = event.tiers[0];
  document.getElementById('event-price').textContent = tier && tier.price !== null ? tier.name + ' from ₹' + tier.price : 'Ticket prices to be confirmed';
  document.getElementById('event-sample').hidden = !event.sample;
  document.getElementById('event-sample-note').hidden = !event.sample;
  // Updates the timer from the event date; returns nothing. Date-only wording avoids inventing an event time.
  function updateCountdown() {
    document.getElementById('countdown').textContent = (event.sample ? 'Sample · ' : '') + countdownText(event.startTime || event.countdownDate, Date.now());
  }
  updateCountdown();
  // ponytail: one minute resolution is enough for event planning; use seconds only if the community needs them.
  window.setInterval(updateCountdown, 60000);
}

// Builds announcement cards from an array; textContent keeps editable text from executing as HTML.
function showAnnouncements(announcements) {
  const container = document.getElementById('announcements');
  container.replaceChildren();
  for (const announcement of announcements) {
    const card = document.createElement('article');
    card.className = 'news-card';
    const date = document.createElement('time');
    date.dateTime = announcement.date;
    date.textContent = announcement.date;
    const title = document.createElement('h3');
    title.textContent = announcement.title;
    const description = document.createElement('p');
    description.textContent = announcement.text;
    card.append(date, title, description);
    container.append(card);
  }
}

// Builds social links from an array; unconfigured URLs become honest labels, not broken buttons.
function showSocialLinks(links) {
  const container = document.getElementById('social-links');
  container.replaceChildren();
  for (const link of links) {
    let url;
    try {
      url = new URL(link.url);
    } catch {
      url = null;
    }
    if (url && url.protocol === 'https:') {
      const button = document.createElement('a');
      button.className = 'button button-outline';
      button.href = url.href;
      button.textContent = link.label + ' ↗';
      addSocialIcon(button, link.label);
      container.append(button);
    } else {
      const label = document.createElement('span');
      label.className = 'placeholder-link';
      label.textContent = link.label + ' · link coming soon';
      addSocialIcon(label, link.label);
      container.append(label);
    }
  }
}

// Loads each independent content file; failed sections show a retry message without hiding the page.
async function loadHome() {
  const requests = [
    { path: 'data/events.json', render: showEvent },
    { path: 'data/announcements.json', render: showAnnouncements },
    { path: 'data/links.json', render: showSocialLinks }
  ];
  for (const request of requests) {
    try {
      const data = await readData(request.path);
      if (request.path === 'data/events.json') {
        const event = groupEvents(data.events, new Date()).upcoming[0];
        if (event) {
          request.render(event);
        } else {
          document.getElementById('event-title').textContent = 'Your next adventure is on the way';
          document.getElementById('countdown').textContent = 'No upcoming event announced.';
          document.getElementById('event-description').textContent = 'Visit Events for community updates.';
          document.getElementById('event-venue').textContent = '';
          document.getElementById('event-date').textContent = '';
          document.getElementById('event-price').textContent = '';
          document.getElementById('event-sample').hidden = true;
          document.getElementById('event-sample-note').hidden = true;
        }
      } else {
        request.render(data.items);
      }
    } catch {
      const status = document.getElementById('data-status');
      status.hidden = false;
      status.textContent = 'Some updates could not load. Check your connection and refresh to retry. Confirm event details with the organisers before attending.';
      if (request.path === 'data/announcements.json') {
        document.getElementById('announcements').textContent = 'Updates unavailable. Please refresh to retry.';
      }
      if (request.path === 'data/events.json') {
        document.getElementById('countdown').textContent = 'Countdown unavailable. Please refresh to retry.';
      }
    }
  }
}

loadHome();
