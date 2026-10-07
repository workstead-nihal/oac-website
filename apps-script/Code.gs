// Purpose: validate membership, volunteer applications, enquiries and protected attendance before Sheet writes.
// Configure Script Properties in Google; never copy access codes or Sheet IDs into the website.
'use strict';

const MEMBER_FIELDS = ['Name', 'Phone', 'Email', 'City', 'AgeGroup', 'Interests', 'Source', 'Consent', 'JoinedAt', 'RequestId'];
const CHECKIN_FIELDS = ['EventId', 'Phone', 'CheckedInAt', 'RequestId'];
const INTERESTS = ['anime', 'cosplay', 'art', 'gaming', 'K-pop/J-pop', 'other'];
const VOLUNTEER_FIELDS = ['Name', 'Email', 'City', 'Role', 'Availability', 'Message', 'Consent', 'SubmittedAt', 'RequestId'];
const ENQUIRY_FIELDS = ['Name', 'Email', 'Organisation', 'EnquiryType', 'Message', 'Consent', 'SubmittedAt', 'RequestId'];

// Returns a JSON response for a result object; does not expose member data or internal exception text.
function jsonResponse(result) {
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// Handles HTTP GET with a health response; takes the web event and returns no private information.
function doGet(event) {
  return jsonResponse({ ok: true, code: 'ready', checkinOpen: checkinWindowOpen() });
}

// Reads the private on/off switch and required time window; returns false when setup is missing or expired.
function checkinWindowOpen() {
  const properties = PropertiesService.getScriptProperties();
  const start = Date.parse(properties.getProperty('CHECKIN_OPENS_AT') || '');
  const end = Date.parse(properties.getProperty('CHECKIN_CLOSES_AT') || '');
  const now = Date.now();
  return properties.getProperty('CHECKIN_ENABLED') === 'true' && Number.isFinite(start) &&
    Number.isFinite(end) && end > start && now >= start && now < end;
}

// Accepts a URL-encoded JSON payload, validates it, and serializes writes with a script lock.
// Returns an explicit receipt; the caller must never infer success from sending a request alone.
function doPost(event) {
  let requestId = '';
  let lock;
  try {
    if (!event || !event.parameter || !event.parameter.payload || event.parameter.payload.length > 12000) {
      throw new Error('invalid');
    }
    const data = JSON.parse(event.parameter.payload);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('invalid');
    }
    requestId = typeof data.requestId === 'string' ? data.requestId : '';
    if (!/^[a-f0-9-]{36}$/i.test(requestId) || data.website || !['join', 'checkin', 'volunteer', 'contact'].includes(data.action)) {
      throw new Error('invalid');
    }
    const phone = ['join', 'checkin'].includes(data.action) ? normalPhone(data.phone) : '';
    if (data.action === 'checkin') {
      authorizeCheckin(data);
    } else if (data.action === 'join') {
      validateMember(data);
    } else {
      validateEnquiry(data);
    }
    // ponytail: one lock serializes all writes; use indexed transactional storage if event traffic outgrows it.
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
      throw new Error('busy');
    }
    if (data.action === 'checkin') {
      // Recheck after waiting for another write: the window may have closed while this request waited.
      authorizeCheckin(data);
    }
    const properties = PropertiesService.getScriptProperties();
    const sheetId = properties.getProperty('SHEET_ID');
    if (!sheetId) {
      throw new Error('setup');
    }
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    let result;
    if (data.action === 'join') {
      result = saveMember(spreadsheet, data, phone);
    } else if (data.action === 'checkin') {
      result = saveCheckin(spreadsheet, data, phone);
    } else {
      result = saveEnquiry(spreadsheet, data);
    }
    SpreadsheetApp.flush();
    return jsonResponse({ ok: result !== 'not_found', code: result, requestId: requestId });
  } catch (error) {
    const known = ['invalid', 'unauthorized', 'closed', 'busy', 'setup', 'rate_limit'];
    return jsonResponse({ ok: false, code: known.includes(error.message) ? error.message : 'server_error', requestId: requestId });
  } finally {
    if (lock) {
      lock.releaseLock();
    }
  }
}

// Normalizes an Indian mobile phone string to ten digits; throws for letters or malformed numbers.
function normalPhone(value) {
  const text = String(value || '').trim();
  if (!/^[+\d\s()-]+$/.test(text)) {
    throw new Error('invalid');
  }
  let digits = text.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new Error('invalid');
  }
  return digits;
}

// Checks required membership fields and enums; takes submitted data and throws instead of saving bad input.
function validateMember(data) {
  for (const field of ['name', 'city']) {
    if (typeof data[field] !== 'string' || !data[field].trim() || data[field].length > 80 || /[\x00-\x1f]/.test(data[field])) {
      throw new Error('invalid');
    }
  }
  if (typeof data.email !== 'string' || data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('invalid');
  }
  if (!['under-18', '18-24', '25-34', '35-plus'].includes(data.ageGroup) || data.consent !== true) {
    throw new Error('invalid');
  }
  if (!Array.isArray(data.interests) || !data.interests.length || data.interests.length > INTERESTS.length || data.interests.some(interest => !INTERESTS.includes(interest))) {
    throw new Error('invalid');
  }
  if (!['friend', 'instagram', 'event', 'search', 'other'].includes(data.source)) {
    throw new Error('invalid');
  }
}

// Validates a volunteer/partner request; takes submitted data and throws for missing, oversized or unknown fields.
function validateEnquiry(data) {
  const limits = { name: 80, email: 254, message: 2000 };
  if (data.action === 'volunteer') {
    Object.assign(limits, { city: 80, availability: 240 });
    if (!['events', 'art', 'photo', 'social', 'other'].includes(data.role)) {
      throw new Error('invalid');
    }
  } else {
    limits.organisation = 120;
    if (!['venue', 'sponsor', 'brand', 'community', 'other'].includes(data.enquiryType)) {
      throw new Error('invalid');
    }
  }
  for (const field of Object.keys(limits)) {
    if (typeof data[field] !== 'string' || !data[field].trim() || data[field].length > limits[field] || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(data[field])) {
      throw new Error('invalid');
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.message.trim().length < 10 || data.consent !== true) {
    throw new Error('invalid');
  }
}

// Saves an application/enquiry once per request ID; returns a receipt code, with no email notifications sent.
function saveEnquiry(spreadsheet, data) {
  const volunteer = data.action === 'volunteer';
  const table = sheetTable(spreadsheet, volunteer ? 'OAC_Volunteers' : 'OAC_Enquiries', volunteer ? VOLUNTEER_FIELDS : ENQUIRY_FIELDS, {});
  const receipt = volunteer ? 'volunteer_received' : 'enquiry_received';
  for (const row of table.values.slice(1)) {
    if (row[table.indexes.RequestId] === data.requestId) {
      return receipt;
    }
  }
  const values = {
    Name: data.name.trim(), Email: data.email.trim(), Message: data.message.trim(),
    Consent: 'Yes', SubmittedAt: new Date().toISOString(), RequestId: data.requestId
  };
  if (volunteer) {
    Object.assign(values, { City: data.city.trim(), Role: data.role, Availability: data.availability.trim() });
  } else {
    Object.assign(values, { Organisation: data.organisation.trim(), EnquiryType: data.enquiryType });
  }
  appendMapped(table, values);
  return receipt;
}

// Validates the privately entered volunteer code and approved event ID; returns nothing or throws.
function authorizeCheckin(data) {
  if (!checkinWindowOpen()) {
    throw new Error('closed');
  }
  const properties = PropertiesService.getScriptProperties();
  const expected = properties.getProperty('CHECKIN_CODE');
  const events = (properties.getProperty('ACTIVE_EVENT_IDS') || '').split(',').map(value => value.trim());
  if (!expected || expected.length < 24) {
    throw new Error('setup');
  }
  if (typeof data.volunteerCode !== 'string' || data.volunteerCode.length > 200 || data.volunteerCode !== expected) {
    throw new Error('unauthorized');
  }
  if (typeof data.eventId !== 'string' || !data.eventId || !events.includes(data.eventId)) {
    throw new Error('invalid');
  }
}

// Reads the Members header mapping from private Script Properties; returns actual column names.
function memberHeaders() {
  const value = PropertiesService.getScriptProperties().getProperty('MEMBER_HEADER_MAP');
  return value ? JSON.parse(value) : {};
}

// Finds a named tab and verifies required header columns; returns the sheet, values and field indexes.
// Existing columns are never renamed, deleted or reordered automatically.
function sheetTable(spreadsheet, name, fields, mapping) {
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 1) {
    throw new Error('setup');
  }
  const values = sheet.getDataRange().getDisplayValues();
  const indexes = {};
  for (const field of fields) {
    const header = mapping[field] || field;
    const index = values[0].indexOf(header);
    if (index < 0 || values[0].lastIndexOf(header) !== index) {
      throw new Error('setup');
    }
    indexes[field] = index;
  }
  return { sheet: sheet, values: values, indexes: indexes };
}

// Finds a member row by normalized phone; returns the row or null without leaking names to the caller.
function memberRow(table, phone) {
  // ponytail: scan the small community roster; use an indexed store if measured lookup latency grows.
  for (const row of table.values.slice(1)) {
    try {
      if (normalPhone(row[table.indexes.Phone]) === phone) {
        return row;
      }
    } catch {
      // A malformed historical phone should not prevent other members from checking in.
    }
  }
  return null;
}

// Makes user text literal in Sheets; returns escaped text so spreadsheet formulas cannot execute.
function safeCell(value) {
  const text = String(value);
  return /^[=+@-]/.test(text.trimStart()) ? "'" + text : text;
}

// Appends mapped fields in the existing column order; takes a table/data object and returns nothing.
function appendMapped(table, values) {
  const row = new Array(table.values[0].length).fill('');
  for (const field of Object.keys(values)) {
    row[table.indexes[field]] = safeCell(values[field]);
  }
  table.sheet.appendRow(row);
}

// Registers a validated member once per phone; returns a receipt code, never a public member profile.
function saveMember(spreadsheet, data, phone) {
  const table = sheetTable(spreadsheet, 'Members', MEMBER_FIELDS, memberHeaders());
  if (memberRow(table, phone)) {
    // Same generic receipt for an existing phone avoids disclosing membership through the public form.
    return 'joined';
  }
  const cache = CacheService.getScriptCache();
  const cacheKey = 'join-' + phone;
  const attempts = Number(cache.get(cacheKey) || 0);
  if (attempts >= 5) {
    throw new Error('rate_limit');
  }
  cache.put(cacheKey, String(attempts + 1), 600);
  appendMapped(table, {
    Name: data.name.trim(), Phone: "'" + phone, Email: data.email.trim(), City: data.city.trim(),
    AgeGroup: data.ageGroup, Interests: [...new Set(data.interests)].join(', '), Source: data.source,
    Consent: 'Yes', JoinedAt: new Date().toISOString(), RequestId: data.requestId
  });
  return 'joined';
}

// Looks up a member after authorization and records one attendance per phone/event; returns a receipt code.
function saveCheckin(spreadsheet, data, phone) {
  const members = sheetTable(spreadsheet, 'Members', MEMBER_FIELDS, memberHeaders());
  if (!memberRow(members, phone)) {
    return 'not_found';
  }
  const attendance = sheetTable(spreadsheet, 'OAC_CheckIns', CHECKIN_FIELDS, {});
  for (const row of attendance.values.slice(1)) {
    if (row[attendance.indexes.EventId] === data.eventId && row[attendance.indexes.Phone].replace(/^'/, '') === phone) {
      return 'checked_in';
    }
  }
  appendMapped(attendance, { EventId: data.eventId, Phone: "'" + phone, CheckedInAt: new Date().toISOString(), RequestId: data.requestId });
  return 'checked_in';
}

// Run manually once after setting properties; creates only missing tabs and checks existing Members headers.
function setupOAC() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheet = SpreadsheetApp.openById(properties.getProperty('SHEET_ID'));
  const mapping = memberHeaders();
  if (!spreadsheet.getSheetByName('Members')) {
    spreadsheet.insertSheet('Members').appendRow(MEMBER_FIELDS.map(field => mapping[field] || field));
  }
  sheetTable(spreadsheet, 'Members', MEMBER_FIELDS, mapping);
  if (!spreadsheet.getSheetByName('OAC_CheckIns')) {
    spreadsheet.insertSheet('OAC_CheckIns').appendRow(CHECKIN_FIELDS);
  }
  sheetTable(spreadsheet, 'OAC_CheckIns', CHECKIN_FIELDS, {});
  for (const item of [{ name: 'OAC_Volunteers', fields: VOLUNTEER_FIELDS }, { name: 'OAC_Enquiries', fields: ENQUIRY_FIELDS }]) {
    if (!spreadsheet.getSheetByName(item.name)) {
      spreadsheet.insertSheet(item.name).appendRow(item.fields);
    }
    sheetTable(spreadsheet, item.name, item.fields, {});
  }
}
