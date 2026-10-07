// Purpose: dependency-free backend checks using an in-memory Sheet; never connects to real member data.
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const properties = {
  SHEET_ID: 'test-sheet', CHECKIN_CODE: 'private-test-code-at-least-24-characters',
  ACTIVE_EVENT_IDS: 'halloween-2026', CHECKIN_ENABLED: 'false',
  CHECKIN_OPENS_AT: new Date(Date.now() - 3600000).toISOString(),
  CHECKIN_CLOSES_AT: new Date(Date.now() + 3600000).toISOString()
};
let sheetReads = 0;
let lockAvailable = true;
const cache = new Map();

// Creates a tiny fake tab from header names; returns only the Sheet methods used by the actual backend.
function fakeSheet(headers) {
  const rows = [headers];
  return {
    rows,
    getLastRow() { return rows.length; }, // Returns row count; input: none.
    getDataRange() {
      // Returns displayed values; leading literal apostrophes are not visible in real Sheets.
      return { getDisplayValues() { return rows.map(row => row.map(value => String(value).replace(/^'/, ''))); } };
    },
    appendRow(row) { rows.push(row); return this; } // Saves a row in memory; returns the fake tab.
  };
}

const sheets = {
  Members: fakeSheet(['Name', 'Phone', 'Email', 'City', 'AgeGroup', 'Interests', 'Source', 'Consent', 'JoinedAt', 'RequestId']),
  OAC_CheckIns: fakeSheet(['EventId', 'Phone', 'CheckedInAt', 'RequestId'])
};
const context = vm.createContext({
  PropertiesService: {
    // Returns the fake private properties store; input: none.
    getScriptProperties() { return { getProperty(key) { return properties[key] || null; } }; }
  },
  LockService: {
    // Returns an in-memory lock; input: none, output: the two methods used by doPost.
    getScriptLock() { return { tryLock() { return lockAvailable; }, releaseLock() {} }; }
  },
  CacheService: {
    // Returns the fake cache; get takes a key, put takes a key/value, and neither contacts a service.
    getScriptCache() { return { get(key) { return cache.get(key); }, put(key, value) { cache.set(key, value); } }; }
  },
  SpreadsheetApp: {
    // Opens the fake spreadsheet; output: name-based fake tabs, with a read counter for access checks.
    openById() { sheetReads++; return { getSheetByName(name) { return sheets[name]; } }; },
    flush() {} // Real flush persists pending writes; no work is needed for an in-memory test.
  },
  ContentService: {
    MimeType: { JSON: 'json' },
    // Returns JSON text via the method used by production code; input: serialized response.
    createTextOutput(text) { return { setMimeType() { return text; } }; }
  }
});
vm.runInContext(fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8'), context);
let sequence = 0;

// Calls the real doPost with one fake HTTP event; takes a payload and returns its parsed receipt.
function post(payload) {
  sequence++;
  const requestId = '00000000-0000-4000-8000-' + String(sequence).padStart(12, '0');
  return JSON.parse(context.doPost({ parameter: { payload: JSON.stringify({ requestId, website: '', ...payload }) } }));
}

const member = {
  action: 'join', name: '=1+1', phone: '+91 98765 43210', email: 'test@example.com',
  city: 'Bhubaneswar', ageGroup: '18-24', interests: ['anime', 'cosplay'], source: 'friend', consent: true
};
assert.equal(post({ ...member, consent: false }).code, 'invalid');
assert.equal(post({ ...member, phone: 'letters' }).code, 'invalid');
assert.equal(post({ ...member, website: 'bot' }).code, 'invalid');
assert.equal(post(member).code, 'joined');
assert.equal(sheets.Members.rows.length, 2);
assert.equal(sheets.Members.rows[1][0], "'=1+1", 'Formula-like names must remain literal');
assert.equal(post({ ...member, phone: '9876543210' }).code, 'joined');
assert.equal(sheets.Members.rows.length, 2, 'Retry/duplicate signup must not add rows');

const attendance = { action: 'checkin', phone: '9876543210', eventId: 'halloween-2026', volunteerCode: properties.CHECKIN_CODE };
let previousReads = sheetReads;
assert.equal(post(attendance).code, 'closed');
assert.equal(sheetReads, previousReads, 'Closed check-in must not read the member Sheet');
properties.CHECKIN_ENABLED = 'true';
const originalOpening = properties.CHECKIN_OPENS_AT;
properties.CHECKIN_OPENS_AT = new Date(Date.now() + 3600000).toISOString();
assert.equal(post(attendance).code, 'closed', 'A future opening must not permit early check-in');
assert.equal(sheetReads, previousReads);
properties.CHECKIN_OPENS_AT = originalOpening;
assert.equal(post({ ...attendance, volunteerCode: 'wrong' }).code, 'unauthorized');
assert.equal(sheetReads, previousReads, 'Wrong code must not read the member Sheet');
assert.equal(post({ ...attendance, eventId: 'unknown' }).code, 'invalid');
assert.equal(post(attendance).code, 'checked_in');
assert.equal(post(attendance).code, 'checked_in');
assert.equal(sheets.OAC_CheckIns.rows.length, 2, 'Attendance is unique per event and phone');
assert.equal(post({ ...attendance, phone: '9123456789' }).code, 'not_found');
assert.equal(sheets.OAC_CheckIns.rows.length, 2);
properties.CHECKIN_CLOSES_AT = new Date(Date.now() - 1000).toISOString();
assert.equal(post(attendance).code, 'closed');
lockAvailable = false;
assert.equal(post({ ...member, phone: '9123456789' }).code, 'busy');
assert.equal(sheets.Members.rows.length, 2);
console.log('All backend checks passed: validation, formula escaping, duplicate prevention, protected lookup, window expiry and lock contention.');
