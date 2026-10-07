// Purpose: render Events and Tickets from one editable catalogue, including safe calendar links.
'use strict';

// Converts an event into a Google Calendar URL; unconfirmed times become an honest all-day entry.
function calendarAddress(event) {
  const day = event.countdownDate.slice(0, 10);
  const following = new Date(day + 'T00:00:00Z');
  following.setUTCDate(following.getUTCDate() + 1);
  let dates = day.replaceAll('-', '') + '/' + following.toISOString().slice(0, 10).replaceAll('-', '');
  if (event.startTime && event.endTime) {
    // Formats an ISO timestamp for Calendar; returns UTC text so India time is not shifted incorrectly.
    function calendarTime(value) {
      return new Date(value).toISOString().replaceAll('-', '').replaceAll(':', '').replace('.000', '');
    }
    if (Date.parse(event.endTime) <= Date.parse(event.startTime)) {
      throw new Error('The event must end after it starts.');
    }
    dates = calendarTime(event.startTime) + '/' + calendarTime(event.endTime);
  }
  const parameters = new URLSearchParams({
    action: 'TEMPLATE',
    text: (event.sample ? '[SAMPLE] ' : '') + event.title,
    dates,
    ctz: 'Asia/Kolkata',
    location: event.venue,
    details: event.description + (event.sample ? '\nSample event: confirm all details with OAC before attending.' : '') +
      (!event.startTime || !event.endTime ? '\nTime to be confirmed. This is an all-day reminder.' : '')
  });
  return 'https://calendar.google.com/calendar/render?' + parameters.toString();
}

// Creates an element with a class and literal text; returns it without treating JSON as HTML.
function contentElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

// Renders a ticket button from an event; returns a link or an explanatory unconfigured label.
function ticketButton(event) {
  const address = ticketAddress(event.ticketUrl);
  if (!address) {
    return contentElement('p', 'sample-note', 'Ticket link coming soon — sales are not open here.');
  }
  const button = contentElement('a', 'button', 'Get tickets ↗');
  button.href = address;
  return button;
}

// Builds an event card from one catalogue entry and a past-event flag; returns semantic HTML nodes.
function eventCard(event, past) {
  const card = contentElement('article', 'catalogue-card', '');
  const date = contentElement('time', 'eyebrow', new Date(event.countdownDate).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric'
  }));
  date.dateTime = event.countdownDate.slice(0, 10);
  card.append(date, contentElement('h3', '', event.title));
  if (event.sample) {
    card.append(contentElement('p', 'sample-note', 'EDITABLE SAMPLE — details await organiser confirmation.'));
  }
  card.append(contentElement('p', '', event.description), contentElement('p', 'venue', event.venue));
  const time = event.startTime ? new Date(event.startTime).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit'
  }) + ' IST' : 'Time to be confirmed';
  card.append(contentElement('p', 'sample-note', time));
  const tiers = contentElement('ul', 'tier-summary', '');
  for (const tier of event.tiers) {
    tiers.append(contentElement('li', '', tier.name + ' · ' + (tier.price === null ? 'Price to be confirmed' : '₹' + tier.price)));
  }
  card.append(tiers);
  if (!past) {
    const actions = contentElement('div', 'button-row', '');
    actions.append(ticketButton(event));
    const details = contentElement('a', 'button button-outline', 'Compare ticket tiers');
    details.href = 'tickets.html?event=' + encodeURIComponent(event.id);
    const calendar = contentElement('a', 'text-link', 'Add to Google Calendar ↗');
    calendar.href = calendarAddress(event);
    actions.append(details, calendar);
    card.append(actions);
  }
  return card;
}

// Fills upcoming/past sections from the catalogue; returns nothing and supplies honest empty states.
function showEvents(events) {
  const groups = groupEvents(events, new Date());
  for (const name of ['upcoming', 'past']) {
    const container = document.getElementById(name + '-events');
    container.replaceChildren();
    for (const event of groups[name]) {
      container.append(eventCard(event, name === 'past'));
    }
    if (!groups[name].length) {
      container.append(contentElement('p', '', name === 'past' ? 'Our past event archive will appear here once the team adds it.' : 'No upcoming events announced. Check back for your next side quest.'));
    }
  }
}

// Shows tiers for a requested upcoming event or the next one; prevents selling tickets for past events.
function showTickets(events) {
  const container = document.getElementById('ticket-tiers');
  const upcoming = groupEvents(events, new Date()).upcoming;
  const requested = new URLSearchParams(window.location.search).get('event');
  const event = requested ? upcoming.find(item => item.id === requested) : upcoming[0];
  container.replaceChildren();
  if (!event) {
    document.getElementById('ticket-event-title').textContent = 'No tickets available';
    document.getElementById('ticket-event-note').textContent = '';
    container.append(contentElement('p', '', 'This event is unavailable or has passed. Browse Events for the latest gatherings.'));
    return;
  }
  document.getElementById('ticket-event-title').textContent = event.title;
  document.getElementById('ticket-event-note').textContent = event.sample ? 'Editable sample tiers. Prices and inclusions await organiser confirmation.' : 'Tickets are handled by our external ticketing partner. Review their terms before booking.';
  for (const tier of event.tiers) {
    const card = contentElement('article', 'catalogue-card', '');
    card.append(contentElement('h3', '', tier.name), contentElement('p', 'tier-price', tier.price === null ? 'Price to be confirmed' : '₹' + tier.price), contentElement('p', '', tier.description), ticketButton(event));
    container.append(card);
  }
}

// Loads catalogue data and renders the current page; failures expose a button for a fresh request.
async function loadEventPage() {
  const status = document.getElementById('catalogue-status');
  const retry = document.getElementById('retry-content');
  retry.disabled = true;
  status.textContent = 'Loading event details…';
  try {
    const data = await readData('data/events.json');
    if (document.body.dataset.page === 'events') {
      showEvents(data.events);
    } else {
      showTickets(data.events);
    }
    status.textContent = '';
    retry.hidden = true;
  } catch {
    status.textContent = 'We couldn’t load event details. Check your signal and retry.';
    retry.hidden = false;
  } finally {
    retry.disabled = false;
  }
}

document.getElementById('retry-content').addEventListener('click', loadEventPage);
loadEventPage();
