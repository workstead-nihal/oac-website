<!-- Purpose: beginner deployment and event-day access instructions for the private OAC Sheet backend. -->
# Set up website membership and check-in

The website is ready for deployment, but no endpoint or Sheet headers have been supplied yet. Do not claim a form works live until you complete these steps and test from the actual website origin. Your existing Google Forms remain separate:

- Sign-up: [existing Google form](https://forms.gle/rW8hMV5NVkHinpzq7).
- Legacy attendance: keep its existing URL in the team's private handover notes, not public website JSON.

The website links the existing signup as a fallback, but does not expose the old attendance form in public navigation. Editing this backend does not change either Google Form. When attendance should be closed, turn off “Accepting responses” in the existing Google Form as well. If legacy form responses go to another tab, they are not automatically copied into Members; confirm the current arrangement before switching systems.

## 1. Make a test copy and check the headers

1. Open your private Google Sheet. Make a test copy first; do not experiment with real member records.
2. Inspect row 1 in the `Members` tab. Use plain unique headers; avoid merged cells. Share only header names with the developer, never members' records.
3. The default expected headers are `Name`, `Phone`, `Email`, `City`, `AgeGroup`, `Interests`, `Source`, `Consent`, `JoinedAt`, `RequestId`. Extra columns are preserved and left blank on new website rows; your formulas must handle that if needed.
4. If the existing form uses different headers, map them with the `MEMBER_HEADER_MAP` Script Property. For example, if your phone column is labelled “WhatsApp Number”, use `{"Phone":"WhatsApp Number"}`. Map every differently named field. The keys must remain the expected names above, and the values must exactly match your existing row 1.
5. If a required field has no corresponding existing column, add a new header in an empty column after reviewing with the team. Do not rename existing Google Form response columns, delete data, or reorder columns. Check that your existing form still writes correctly afterwards.

`setupOAC()` checks existing Members headers and stops on a mismatch. It creates a Members tab only if none exists. It creates a separate `OAC_CheckIns` tab with `EventId`, `Phone`, `CheckedInAt`, `RequestId`, keeping the old check-in form's responses intact.

Phase 4 adds `OAC_Volunteers` (`Name`, `Email`, `City`, `Role`, `Availability`, `Message`, `Consent`, `SubmittedAt`, `RequestId`) and `OAC_Enquiries` (`Name`, `Email`, `Organisation`, `EnquiryType`, `Message`, `Consent`, `SubmittedAt`, `RequestId`). Run `setupOAC()` again to create these missing tabs; it verifies existing tabs without deleting or renaming anything. Copy the updated `Code.gs` and redeploy a new version before enabling the new forms. Applications/enquiries store email for follow-up, but do not send email notifications automatically; organisers should review their tabs regularly.

## 2. Create the Apps Script project

1. In the test Sheet, choose Extensions → Apps Script. If an existing script is present, create a separate standalone Apps Script project at `script.google.com` so existing code is preserved. Do not overwrite an existing script.
2. Copy the complete contents of `Code.gs` from this folder into a new script file. Use the V8 JavaScript runtime.
3. Under Project Settings → Script Properties, add:

| Property | Value |
| --- | --- |
| `SHEET_ID` | The ID between `/d/` and `/edit` in your private Sheet URL |
| `MEMBER_HEADER_MAP` | Optional JSON header mapping, as described above |
| `CHECKIN_CODE` | A randomly generated private code of at least 24 characters; share only with event volunteers |
| `ACTIVE_EVENT_IDS` | Allowed event IDs from `data/events.json`, separated by commas; for test data: `halloween-2026` |
| `CHECKIN_ENABLED` | `false` initially |
| `CHECKIN_OPENS_AT` | An ISO timestamp in India time, e.g. `2026-10-31T15:00:00+05:30`; this example is not a confirmed event time |
| `CHECKIN_CLOSES_AT` | A later ISO timestamp, e.g. `2026-10-31T23:00:00+05:30`; this example is not a confirmed event time |

4. Select `setupOAC` from the function dropdown and run it. Review Google's access request and authorise only the intended project/Sheet. If it reports `setup`, correct the headers before proceeding.
5. Keep the Sheet private. The website never needs direct sharing access. Do not add the Sheet ID or access code to Git, JSON or `js/config.js`.

## 3. Deploy the endpoint

1. Choose Deploy → New deployment → Web app.
2. Execute as the account that owns and may edit the Sheet. For anonymous signup, the deployment must permit the public to call it (“Anyone” where that option is available). School/work account policies may disallow this; use an approved account or keep the existing Google signup form.
3. Review and authorise the deployment. Copy the production URL ending in `/exec`; `/dev` is only for project editors.
4. Paste that public URL into `appsScriptUrl` in `/js/config.js`. Do not put any code/password in that file.
5. Visit the endpoint without parameters: it should return a small JSON response with `code: "ready"` and `checkinOpen: false` while closed. No member records should appear.
6. Open Join on your local HTTP preview and submit one test member. Confirm a receipt AND a matching row in the test Sheet. Repeat the test from your deployed site: a local pass does not verify cross-origin behavior in production.

The browser uses URL-encoded POST with no custom headers and follows Google's Content Service redirects. Responses must be readable. Never change fetch to `no-cors` to hide an error: that makes the receipt unreadable and cannot confirm a write. If CORS or an organisation policy prevents response reads, keep the Google Form fallback active and resolve the deployment issue; the UI will correctly show uncertainty rather than false success.

See Google's [web-app deployment guide](https://developers.google.com/apps-script/guides/web) and [Content Service guide](https://developers.google.com/apps-script/guides/content) for deployment and redirect behavior. Writes use [LockService](https://developers.google.com/apps-script/reference/lock/lock-service) to prevent concurrent duplicate registrations/attendance.

## 4. Open and close event check-in

`checkin.html` has no public navigation link and carries `noindex, nofollow`. Share its direct URL privately with volunteers. Hiding the page is only a convenience; the backend enforces the code, allowed event and time window.

1. Before the event, confirm its unique JSON `id` is in `ACTIVE_EVENT_IDS`.
2. Set the opening time a few hours before the actual event and the closing time after the shift ends. Use the explicit `+05:30` offset. Both timestamps are required.
3. Set `CHECKIN_ENABLED` to the exact string `true`. The window opens automatically at the configured time and closes automatically at its end.
4. To close immediately, change `CHECKIN_ENABLED` back to `false`. No new website deploy is needed for Script Property changes.
5. Volunteers refresh `checkin.html` to see whether it is open, choose the event and enter the private code. Each phone is looked up and recorded in one action; no member profile is returned.
6. Rotate the code when volunteer access changes or it is exposed. Close the legacy Google check-in form independently.

If someone submits after the window closes, the backend rejects it even if the form remains visible from an earlier load. Outside the window or without the private code, neither lookup nor attendance writes are allowed. This does not prevent strangers from making HTTP requests to a publicly deployed endpoint; see the limitations below.

## 5. Test before real use

- Use test data only. Confirm a valid join, friendly validation errors, consent enforcement and honeypot rejection.
- Submit the same phone twice: only one membership row should exist. Existing member details are not overwritten; corrections must be made privately by an organiser.
- Test closed, not-yet-open and expired windows: no attendance row should be written.
- Test an incorrect code and an event not listed in `ACTIVE_EVENT_IDS`: no lookup result should be disclosed.
- With the correct code and an open test window, check a registered phone: green “Checked in”. Check it again: still one row for that event/phone.
- Use an unknown phone: red “Not found, sign up now”, no attendance write.
- Use `+91` or spaced phone formats and verify normalization.
- Simulate a slow/offline connection. The phone remains until receipt; retry and confirm a single row. Never infer failure from a timeout alone: the server might already have written it.
- Check HTML-like names and formula-like input: JSON text must not become executable HTML or a spreadsheet formula.
- Verify the existing Google Forms continue writing to their original tabs after any header additions.
- Test volunteer and contact forms using test data. Check consent, role/topic validation, message length and email validation. Retry with the same request ID and confirm only one row appears in its tab. No phone number is collected on these two forms.
- Test browser CORS and mobile behavior on the deployed domain. The supplied local mocks do not verify Google deployment or its permissions.

## Updating and handing over

After editing Apps Script code, use Deploy → Manage deployments → Edit → New version → Deploy. Keep the same endpoint when possible. Script Property toggles do not require a code redeploy. Transfer ownership and deployer access privately; after an account/domain transfer, verify the endpoint and authorisations again. Store code recovery and Sheet ownership instructions in the team's private account records, not this repository.

## Known limitations

- A shared volunteer code provides backend protection but no individual volunteer identity or audit trail. Any holder can check in approved members during the window. Use individual authenticated volunteer accounts if that becomes necessary.
- The signup form does not verify phone ownership. A duplicate phone receives the same generic confirmation without exposing existing details, and does not overwrite them.
- Honeypots are a basic spam deterrent, not bot-proof. Cache limits are best-effort and quotas may be exhausted by distributed requests. Closing attendance stops attendance writes, not all public endpoint traffic.
- `ponytail:` the script scans member/attendance rows and serializes writes through one lock. This is suitable for a student community, not a high-throughput ticketing system; move to indexed storage if measured event-day traffic outgrows it.
- Personal details and an uncertain request live only in the open browser tab, not localStorage. They survive connection loss while the page stays open, but cannot survive a crash, shutdown or reload. Keep the page open for retry; inspect the Sheet before re-entering uncertain submissions.
- A parental-consent checkbox is a declaration, not verified parental permission. The team must define and follow its actual membership/privacy policy.
- Existing member schema, live Google deployment, account permissions and end-to-end CORS remain unverified until the team supplies/configures them.

## Work With Us forms — updated deployment

The same master Sheet and `/exec` endpoint now accept four additional actions: `stall`, `sponsor`, `partnership` and `creator`. They return `stall_received`, `sponsor_received`, `partnership_received` and `creator_received` with the submitted request ID. Each writes only its corresponding `OAC_Stalls`, `OAC_Sponsors`, `OAC_Partnerships` or `OAC_Creators` tab.

1. Copy the updated `Code.gs` into the intended Apps Script project, preserving unrelated scripts. Use a test Sheet first.
2. Run `setupOAC()` again. It adds missing collaboration tabs and verifies existing schemas without deleting rows. Headers are the corresponding field names in `WORK_FORMS`, followed by `Consent`, `SubmittedAt`, `RequestId`.
3. Deploy → Manage deployments → Edit → New version → Deploy. Keep the same public `/exec` URL when possible and configure it in `js/config.js`.
4. Submit test data from each of the four website forms. Verify a readable matching receipt and one new row in the correct tab. Retry with the same request ID: still only one row.
5. Verify missing fields, invalid email/phone/HTTPS links, unknown options, unchecked consent and filled honeypots produce no row. Run `node apps-script/checks.cjs` with the existing Node runtime for fake-Sheet regression checks.
6. Repeat from `https://joinoac.in/` to check live cross-origin response handling. Review the four tabs regularly; no notification email is automatically sent.

Schema changes require matching edits to website `data/work.json` and backend `WORK_FORMS`, plus a redeploy. Preserve Google Workspace and private Sheet ownership in handover. Patron payments are not handled by this script: links, recurring billing and fulfilment remain pending.
