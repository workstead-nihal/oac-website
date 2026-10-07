// Purpose: validated membership, applications, enquiries and check-in with explicit receipts and safe retries.
'use strict';

const communityForm = document.getElementById('community-form');
const formStatus = document.getElementById('form-status');
const submitButton = document.getElementById('submit-form');
let pendingEntry = null;
let submitting = false;

// Normalizes the phone input to an Indian mobile number; returns null for invalid input.
function formPhone(value) {
  const text = value.trim();
  if (!/^[+\d\s()-]+$/.test(text)) {
    return null;
  }
  let digits = text.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

// Converts labelled form fields into a request object; returns the data or null with native error feedback.
function collectEntry() {
  const fields = new FormData(communityForm);
  const phoneInput = communityForm.elements.phone;
  const phone = phoneInput ? formPhone(String(fields.get('phone') || '')) : null;
  if (phoneInput) {
    phoneInput.setCustomValidity(phone ? '' : 'Enter a 10-digit Indian mobile number, optionally with +91.');
  }
  for (const field of ['name', 'city', 'organisation', 'availability', 'message']) {
    const input = communityForm.elements[field];
    if (input && input.required) {
      input.setCustomValidity(input.value.trim() ? '' : 'Please fill in this field.');
    }
  }
  if (communityForm.dataset.action === 'join') {
    const interest = communityForm.querySelector('[name="interests"]');
    interest.setCustomValidity(fields.getAll('interests').length ? '' : 'Choose at least one interest.');
  }
  if (!communityForm.reportValidity()) {
    return null;
  }
  const data = Object.fromEntries(fields.entries());
  data.action = communityForm.dataset.action;
  if (phoneInput) {
    data.phone = phone;
  }
  if (data.action === 'join') {
    data.interests = fields.getAll('interests');
  }
  if (data.action !== 'checkin') {
    data.consent = fields.get('consent') === 'on';
  }
  return data;
}

// Clears only custom error flags when any field changes; native required/email checks still apply.
// Otherwise an old error can block the next submit before our validation handler gets a chance to run.
function clearFieldErrors(event) {
  for (const field of ['phone', 'name', 'city', 'organisation', 'availability', 'message']) {
    if (communityForm.elements[field]) {
      communityForm.elements[field].setCustomValidity('');
    }
  }
  if (communityForm.dataset.action === 'join') {
    communityForm.querySelector('[name="interests"]').setCustomValidity('');
  }
}

// Displays a status message and visual state; takes a code/message and returns nothing.
function showFormStatus(state, message) {
  formStatus.className = 'form-status ' + state;
  formStatus.textContent = message;
  if (state === 'error' || state === 'success') {
    formStatus.focus();
  }
}

// Sends one request using a simple CORS POST; returns a confirmed receipt or throws on uncertainty.
// Never use no-cors: an unreadable response cannot prove the Sheet was updated.
async function sendEntry(entry) {
  const endpoint = window.OAC_CONFIG.appsScriptUrl;
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)) {
    throw new Error('unconfigured');
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST', credentials: 'omit', redirect: 'follow', signal: controller.signal,
      body: new URLSearchParams({ payload: JSON.stringify(entry) })
    });
    if (!response.ok) {
      throw new Error('network');
    }
    const result = await response.json();
    if (result.requestId !== entry.requestId || typeof result.ok !== 'boolean' || typeof result.code !== 'string') {
      throw new Error('receipt');
    }
    return result;
  } finally {
    window.clearTimeout(timeout);
  }
}

// Handles a submit event, prevents double clicks, and retains uncertain entries for idempotent retry.
async function submitEntry(event) {
  event.preventDefault();
  if (submitting) {
    return;
  }
  const data = collectEntry();
  if (!data) {
    showFormStatus('error', 'Please check the highlighted field and try again.');
    return;
  }
  const signature = JSON.stringify(data);
  if (!pendingEntry || pendingEntry.signature !== signature) {
    pendingEntry = { signature: signature, data: { ...data, requestId: crypto.randomUUID() } };
  }
  submitting = true;
  submitButton.disabled = true;
  // Keep fields steady until the receipt arrives, so a volunteer cannot accidentally change the pending phone.
  const fieldset = document.getElementById('form-fields');
  fieldset.disabled = true;
  document.getElementById('signup-link').hidden = true;
  showFormStatus('pending', 'Sending… please keep this page open.');
  try {
    const result = await sendEntry(pendingEntry.data);
    const accepted = {
      join: 'joined', checkin: 'checked_in', volunteer: 'volunteer_received', contact: 'enquiry_received'
    }[data.action];
    if (result.ok && result.code === accepted) {
      const successMessages = {
        join: 'You’re in! Your membership request is confirmed. Welcome to the OAC family.',
        checkin: '✓ Checked in — attendance confirmed.',
        volunteer: 'Application received! The OAC team can follow up by email. Thank you for offering to help.',
        contact: 'Enquiry received! The OAC team can follow up by email. Thank you for getting in touch.'
      };
      showFormStatus('success', successMessages[data.action]);
      pendingEntry = null;
      submitButton.textContent = data.action === 'checkin' ? 'Check in next member' : 'Submission confirmed';
      if (data.action === 'join') {
        document.getElementById('join-success').hidden = false;
        communityForm.hidden = true;
      } else if (data.action === 'checkin') {
        communityForm.elements.phone.value = '';
      } else {
        communityForm.hidden = true;
      }
    } else {
      const messages = {
        not_found: 'Not found, sign up now. No attendance was recorded.',
        unauthorized: 'Access code not accepted. Ask the event lead for the current volunteer code.',
        closed: 'Check-in is closed. The event lead must open the check-in window first.',
        invalid: 'Check your details and selected event, then try again.',
        setup: 'The community form is not fully configured. Please contact the OAC team.',
        busy: 'The Sheet is busy. Keep your entry here and retry in a moment.',
        rate_limit: 'Too many attempts. Please wait before trying again.'
      };
      showFormStatus('error', messages[result.code] || 'The server could not confirm this entry. Keep the page open and retry.');
      document.getElementById('signup-link').hidden = result.code !== 'not_found';
      submitButton.textContent = 'Retry';
    }
  } catch (error) {
    showFormStatus('error', error.message === 'unconfigured' ? 'This form is awaiting backend setup. Your details have not been sent.' : 'No confirmation received. Your entry is still here. Keep this page open and retry; it may already have reached the Sheet.');
    submitButton.textContent = 'Retry';
  } finally {
    submitting = false;
    fieldset.disabled = false;
    submitButton.disabled = false;
    if (data.action === 'checkin' && !communityForm.elements.phone.value) {
      communityForm.elements.phone.focus();
    }
  }
}

// Populates check-in event choices from JSON; returns nothing, offers reload on failed content download.
async function loadCheckinEvents() {
  if (communityForm.dataset.action !== 'checkin') {
    return;
  }
  submitButton.disabled = true;
  communityForm.hidden = true;
  try {
    const endpoint = window.OAC_CONFIG.appsScriptUrl;
    if (!endpoint) {
      showFormStatus('pending', 'Check-in is closed while backend setup is pending. Ask the event lead for access.');
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    let availability;
    try {
      const response = await fetch(endpoint, { credentials: 'omit', signal: controller.signal });
      if (!response.ok) {
        throw new Error('network');
      }
      availability = await response.json();
    } finally {
      window.clearTimeout(timeout);
    }
    if (availability.checkinOpen !== true) {
      showFormStatus('pending', 'Check-in is currently closed. It opens only during the event’s volunteer check-in window.');
      return;
    }
    const data = await readData('data/events.json');
    const select = communityForm.elements.eventId;
    for (const event of groupEvents(data.events, new Date()).upcoming) {
      const option = document.createElement('option');
      option.value = event.id;
      option.textContent = (event.sample ? '[Sample] ' : '') + event.title;
      select.append(option);
    }
    communityForm.hidden = false;
    submitButton.disabled = false;
    showFormStatus('pending', 'Volunteer check-in is open. Enter the private access code from your event lead.');
  } catch {
    showFormStatus('error', 'Event choices could not load. Check your connection and refresh; no check-in has been sent.');
  }
}

// Warns before leaving while an entry is awaiting a receipt; uses no persistent storage of private details.
function warnPending(event) {
  if (pendingEntry) {
    event.preventDefault();
    event.returnValue = '';
  }
}

// Loads the existing signup fallback and approved social links from JSON; returns nothing.
async function loadJoinLinks() {
  if (communityForm.dataset.action !== 'join') {
    return;
  }
  try {
    const links = await readData('data/links.json');
    const fallback = document.getElementById('existing-signup');
    const address = ticketAddress(links.signupFormUrl);
    if (address) {
      fallback.href = address;
      fallback.hidden = false;
    }
    const container = document.getElementById('join-socials');
    const socials = links.items.filter(link => ['WhatsApp', 'Discord'].includes(link.label) && ticketAddress(link.url));
    if (socials.length) {
      container.replaceChildren();
      for (const social of socials) {
        const button = document.createElement('a');
        button.className = 'button';
        button.href = ticketAddress(social.url);
        button.textContent = 'Join our ' + social.label + ' ↗';
        addSocialIcon(button, social.label);
        container.append(button);
      }
    }
  } catch {
    // Membership submission remains usable if optional social content is temporarily unavailable.
  }
}

communityForm.addEventListener('submit', submitEntry);
communityForm.addEventListener('input', clearFieldErrors);
if (communityForm.dataset.action !== 'checkin' && window.OAC_CONFIG.appsScriptUrl) {
  showFormStatus('pending', 'Complete your details below. Keep this page open until your submission receipt arrives.');
}
window.addEventListener('beforeunload', warnPending);
loadCheckinEvents();
loadJoinLinks();
