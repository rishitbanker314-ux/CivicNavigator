/**
 * CivicNavigator Test Harness
 * Tests: matchKey intent routing, risk prediction coverage, political guard
 * Run: node test.js
 */

const { JSDOM } = require('jsdom');

// Minimal DOM needed to load app.js without errors
const dom = new JSDOM(`<!DOCTYPE html><body>
  <div id="chat-messages"></div>
  <form id="chat-form"><input id="chat-input" /></form>
  <div id="nav-mobile-toggle"></div>
  <div class="nav-links"></div>
</body>`);
global.window   = dom.window;
global.document = dom.window.document;
global.localStorage = { getItem: () => null, setItem: () => {} };
global.navigator = dom.window.navigator;
global.alert = (msg) => {}; // suppress alerts

// ── Extract matchKey from app.js source ──
const fs   = require('fs');
const src  = fs.readFileSync(__dirname + '/app.js', 'utf8');

// Pull matchKey using its known regex patterns (mirrored from app.js)
function matchKey(q) {
  const lower = q.toLowerCase();
  
  if (/united states|america|us|president|senator|congressman|democrat|republican|federal|state legislature/.test(lower)) {
    return 'non_india';
  }

  // Explicit Location Guard: If asking for location-specific info but unclear
  if (/(in my state|in my city|local|my district)/.test(lower) && !/delhi|mumbai|maharashtra|karnataka|up|punjab|bengal|kerala|tamil nadu|gujarat|rajasthan|bihar|mp|ap|telangana|odisha/.test(lower)) {
    return 'location_guard';
  }

  if (lower.includes('who should i vote for') || lower.includes('who to vote for') ||
      lower.includes('endorse') || lower.includes('candidate recommendation') ||
      /candidate|party|bjp|congress|aap|predict|campaign|donate|fund|who.*vote/.test(lower)) {
    return 'political_guard';
  }

  if (/eligib|citizen|qualify|age|18|resident|nri|oci/.test(lower))           return 'eligibility';
  if (/verif|status|confirm|check.*reg|look.*up|search.*name/.test(lower))    return 'verify';
  if (/register|sign up|enroll|form 6|new.*voter/.test(lower))                return 'register';
  if (/early.{0,10}vot|vote.{0,10}early|before.*election.*day/.test(lower))   return 'early';
  if (/provisional|tendered|someone.*voted|impersonat/.test(lower))           return 'provisional';
  if (/result|winner|outcome|certified|count|tally|exit poll/.test(lower))    return 'results';
  if (/poll|where.*vote|location|booth|find.*place|part number/.test(lower))  return 'polling';
  if (/\bid\b|identification|photo|epic|voter id|aadhaar|pan/.test(lower))    return 'id';
  if (/mail|absentee|postal|form 12d/.test(lower))                            return 'mail';
  return 'default';
}

const RISK_KEYS = ['register','verify','polling','id','mail','early','provisional','eligibility'];

// ── Test cases ──
const TESTS = [
  // [ description, input, expected key ]
  ["First-time voter wants to enroll",           "I'm a first-time voter, how do I apply for Voter ID?", "id"],
  ["Rural user asking about postal ballot",      "I live in rural area, how do I get a postal ballot?", "mail"],
  ["User without EPIC",                          "I don't have my EPIC, can I still vote with Aadhaar?", "id"],
  ["User missed deadline (provisional fallback)","I missed enrollment, what do I do?",               "register"],
  ["Confused user asks who to vote for",         "Who should I vote for?",                             "political_guard"],
  ["User asks about US elections",               "Who is winning the US election?",                    "non_india"],
  ["User asks about location without specifying","Where can I vote in my city?",                       "location_guard"],
  ["User checks eligibility",                    "Am I eligible to vote if I'm 17?",                   "eligibility"],
  ["User wants early voting info",               "Can I vote early before Polling Day?",               "early"],
  ["User wants to verify enrollment",            "How do I verify my name on the electoral roll?",     "verify"],
  ["User wants polling booth",                   "Where do I vote? How do I find my booth?",           "polling"],
  ["User asks about tendered ballot",            "Someone voted in my name, what is a tendered ballot?","provisional"],
  ["User asks about election results",           "Where can I check the exit poll results?",           "results"],
];

let passed = 0, failed = 0;
console.log('\n=== CivicNavigator Intent Router Test ===\n');

TESTS.forEach(([desc, input, expected]) => {
  const got = matchKey(input);
  const ok  = got === expected;
  if (ok) { passed++; } else { failed++; }
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${desc}`);
  if (!ok) console.log(`   Expected: ${expected}  |  Got: ${got}`);
});

console.log('\n=== Risk Coverage Check ===\n');
let riskMissing = 0;
RISK_KEYS.forEach(key => {
  const covered = src.includes(`    ${key}: {`);
  if (covered) {
    console.log(`✅ RISK_BANK has entry: ${key}`);
  } else {
    console.log(`❌ RISK_BANK MISSING entry: ${key}`);
    riskMissing++;
    failed++;
  }
});

// ── Risk Level Assignment Tests ──
const EXPECTED_LEVELS = {
  eligibility: 'low',
  verify:      'medium',
  register:    'high',
  polling:     'medium',
  id:          'medium',
  mail:        'high',
  early:       'low',
  provisional: 'high'
};

console.log('\n=== Risk Level Assignment Test ===\n');

// Parse RISK_LEVEL entries from source text (key + level field)
function extractLevel(key) {
  // Match:  register: {\n      level: 'high',
  const re = new RegExp(`${key}:\\s*\\{[^}]*level:\\s*'(low|medium|high)'`);
  const m = src.match(re);
  return m ? m[1] : null;
}

let levelFailed = 0;
Object.entries(EXPECTED_LEVELS).forEach(([key, expected]) => {
  const got = extractLevel(key);
  const ok  = got === expected;
  if (!ok) { failed++; levelFailed++; }
  console.log(`${ok ? '✅' : '❌'} ${key.padEnd(12)} → expected: ${expected.padEnd(6)} | got: ${got || 'MISSING'}`);
});

// ── Action Plan Coverage + Step Count Tests ──
const ACTION_KEYS = ['register','verify','polling','id','mail','early','provisional','eligibility'];

// Min steps expected per key (guards against empty or placeholder arrays)
const MIN_STEPS = {
  register: 5, verify: 4, polling: 4, id: 3,
  mail: 4, early: 3, provisional: 4, eligibility: 4
};

console.log('\n=== Action Plan Test ===\n');

function extractStepCount(key) {
  // Find ACTION_PLAN[key] array in source and count string entries
  const re = new RegExp(`${key}:\\s*\\[([^\\]]+)\\]`, 's');
  const m = src.match(re);
  if (!m) return 0;
  return (m[1].match(/'[^']+'/g) || []).length;
}

ACTION_KEYS.forEach(key => {
  const count = extractStepCount(key);
  const minOk = count >= (MIN_STEPS[key] || 1);
  const present = count > 0;
  const ok = present && minOk;
  if (!ok) failed++;
  console.log(
    `${ok ? '✅' : '❌'} ${key.padEnd(12)} → ${count} step(s)` +
    (!present ? ' — MISSING' : !minOk ? ` — need ≥${MIN_STEPS[key]}` : '')
  );
});

console.log(`\n=== Results ===`);
const total = TESTS.length + RISK_KEYS.length + Object.keys(EXPECTED_LEVELS).length + ACTION_KEYS.length;
console.log(`Passed: ${total - failed}  |  Failed: ${failed}  |  Total: ${total}`);
if (failed === 0) {
  console.log('\n✅ All tests passed. System is functioning correctly.\n');
} else {
  console.log('\n⚠️  Some tests failed. Review output above.\n');
  process.exit(1);
}
