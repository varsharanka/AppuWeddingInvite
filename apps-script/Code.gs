/**
 * RSVP receiver for Preeti & Vivek's wedding invitation.
 * Writes each RSVP into the "RSVPs" tab of the spreadsheet below.
 * If the same guest answers again (same name), their row is updated instead of duplicated.
 *
 * Deploy: Extensions → Apps Script → paste this file → Deploy → New deployment →
 *   type "Web app", Execute as "Me", Who has access "Anyone" → copy the /exec URL.
 */
const SHEET_ID = '1zQh7FTXoqMcSccr98kRF3wcixllF1PJmGs_1iFfYy-g';
const TAB = 'RSVPs';
const HEADERS = ['Last updated', 'Name', 'Attending', 'Guests', 'Haldi', 'Sangeet', 'Wedding', 'Reception (Chennai)', 'Note', 'Invited as'];
const EVENTS = ['Haldi', 'Sangeet', 'Wedding', 'Reception'];

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!p.name) return page_('RSVP', 'This link records RSVPs for Preeti & Vivek\'s wedding.');
  const r = save_(p);
  const first = r.name.split(' ')[0];
  return r.attending === 'Yes'
    ? page_('Thank you, ' + first + '!', 'Your RSVP is saved. We can\'t wait to celebrate with you in Lonavala.')
    : page_('Thank you, ' + first, 'Your reply is saved. We will miss you and are grateful for your blessings.');
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (!p.name) return ContentService.createTextOutput(JSON.stringify({ ok: false })).setMimeType(ContentService.MimeType.JSON);
  save_(p);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

function save_(p) {
  const clean = v => {
    const s = String(v || '').slice(0, 500).trim();
    return /^[=+\-@]/.test(s) ? "'" + s : s; // stop spreadsheet formulas
  };
  const events = String(p.events || '').split(',');
  const r = {
    name: clean(p.name),
    attending: p.attending === 'no' ? 'No' : 'Yes',
    count: p.attending === 'no' ? 0 : Math.max(1, Math.min(20, parseInt(p.count, 10) || 1)),
    note: clean(p.note),
    guest: clean(p.guest)
  };
  const row = [new Date(), r.name, r.attending, r.count]
    .concat(EVENTS.map(ev => r.attending === 'Yes' && events.indexOf(ev) >= 0 ? 'Yes' : ''))
    .concat([r.note, r.guest]);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sh = ss.getSheetByName(TAB) || ss.insertSheet(TAB);
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS);
      sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
    const last = sh.getLastRow();
    let target = 0;
    if (last > 1) {
      const names = sh.getRange(2, 2, last - 1, 1).getValues();
      const key = r.name.toLowerCase();
      for (let i = 0; i < names.length; i++) {
        if (String(names[i][0]).toLowerCase() === key) { target = i + 2; break; }
      }
    }
    if (target) sh.getRange(target, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return r;
}

function page_(title, msg) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const html =
    '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500&family=Cormorant+Garamond:ital@0;1&family=Pinyon+Script&display=swap">' +
    '<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#dce8f4;font-family:\'Cormorant Garamond\',Georgia,serif;color:#6b4220">' +
    '<main style="margin:16px;max-width:520px;padding:48px 32px;background:#fbf7ee;border:1px solid #c9a47a;outline:1px solid #c9a47a;outline-offset:6px;text-align:center">' +
    '<p style="font-family:Cinzel,serif;letter-spacing:.25em;color:#9a6433;margin:0 0 8px">PREETI &amp; VIVEK</p>' +
    '<h1 style="font-family:\'Pinyon Script\',cursive;font-weight:400;font-size:44px;color:#9a6433;margin:0 0 12px">' + esc(title) + '</h1>' +
    '<p style="font-size:20px;margin:0 0 20px">' + esc(msg) + '</p>' +
    '<p style="font-style:italic;margin:0">You can close this tab and return to the invitation.</p>' +
    '</main></body>';
  return HtmlService.createHtmlOutput(html).setTitle('RSVP · Preeti & Vivek')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
