const QA_BANK = {
  // ── 1. ELIGIBILITY CHECK ──
  'eligibility': '##section## ✅ Required Steps\n• Make sure you are a U.S. citizen\n• Be at least 18 years old by Election Day\n• Live in the state where you want to vote\n\n##section## ⚠️ Important Notes\n• Every state has different rules. Check vote.gov to be sure.',

  // ── 2. VOTER REGISTRATION ──
  'register': '##section## ✅ Required Steps\n• Go to vote.gov to find your state\'s sign-up page\n• Sign up online, by mail, or in person\n\n##section## ⚠️ Important Notes\n• Don\'t wait too long! Each state has a different due date.',

  // ── 3. VERIFICATION ──
  'verify': '##section## ✅ Required Steps\n• Go to your state\'s official election website\n• Look up your name to make sure you are signed up\n• Check that your address is right\n\n##section## ⚠️ Important Notes\n• Only use official government websites to check.',

  // ── 4. POLLING BOOTH IDENTIFICATION ──
  'polling': '##section## ✅ Required Steps\n• Use your state\'s website to find your voting spot\n• Check what time they open and close\n\n##section## ⚠️ Important Notes\n• You must go to the correct location for your home address.',

  // ── 5. VOTING PROCESS ──
  'id': '##section## ✅ Required Steps\n• Check your state\'s website to see if you need an ID to vote\n• Bring your ID with you on Election Day\n\n##section## ⚠️ Important Notes\n• Some states do not ask for a photo ID.',

  'mail': '##section## ✅ Required Steps\n• Ask your local election office for a mail-in ballot\n• Fill it out carefully and sign the envelope\n• Send it back before the due date\n\n##section## ⚠️ Important Notes\n• Not everyone can vote by mail. Check your state\'s rules.',

  'early': '##section## ✅ Required Steps\n• Find out if your state lets you vote before Election Day\n• Go to an official early voting spot\n\n##section## ⚠️ Important Notes\n• Not all states allow you to vote early.',

  'provisional': '##section## ✅ Required Steps\n• Ask the poll worker for a "provisional ballot" if there is a problem finding your name\n• Ask for a receipt so you can track it\n\n##section## ⚠️ Important Notes\n• You always have the right to ask for this special ballot.',

  // ── 6. RESULT AWARENESS ──
  'results': '##section## ✅ Required Steps\n• Check your state\'s official website to see who won\n\n##section## ⚠️ Important Notes\n• News on TV or social media is not the final official answer.',

  // ── OUT OF SCOPE ──
  'political_guard': 'I can only help you learn how to vote, not who to vote for.',

  'unverified': '##section## ✅ Required Steps\n• Please ask about signing up, finding your voting spot, or how to vote\n\n##section## ⚠️ Important Notes\n• I only know about the official steps to vote.',

  'default': '##section## ✅ Required Steps\n• Ask me a clear question like "How do I sign up to vote?"\n\n##section## ⚠️ Important Notes\n• Always double-check your state\'s official website for the exact rules.'
};

const REQUIRED_SECTIONS = ['✅ Required Steps', '⚠️ Important Notes'];

const KEY_RELEVANCE = {
  eligibility: /eligib|citizen|qualify|age|18|resident/,
  register:    /register|sign up|enroll|registration/,
  verify:      /verif|status|confirm|check.*reg|look.*up/,
  polling:     /poll|where.*vote|location|booth|find.*place/,
  id:          /\bid\b|identification|photo|license|passport/,
  mail:        /mail|absentee/,
  early:       /early vot/,
  provisional: /provisional/,
  results:     /result|winner|outcome|certified|count|tally/,
  unverified:  /candidate|party|democrat|republican|predict|campaign|donate|fund/,
  default:     /.*/
};

function matchKey(q) {
  const lower = q.toLowerCase();

  const isPolitical = /who.*vote|which.*candidate|democrat|republican|maga|liberal|conservative|should i vote for/i.test(lower);
  if (isPolitical) return 'political_guard';

  for (const [key, regex] of Object.entries(KEY_RELEVANCE)) {
    if (regex.test(lower)) return key;
  }
  return 'default';
}

function safeDefault(q) {
  return { key: 'default', text: QA_BANK.default, isUnverified: false };
}

function validateChatResponse(q, key, text) {
  const lower = q.toLowerCase();

  if (key === 'political_guard') {
    return { key, text, isUnverified: false };
  }

  if (!text || typeof text !== 'string' || text.trim().length < 30) {
    return safeDefault(q);
  }

  const hasAllSections = REQUIRED_SECTIONS.every(s => text.includes(s));
  if (!hasAllSections) {
    return safeDefault(q);
  }

  if (key !== 'default' && key !== 'unverified') {
    const pattern = KEY_RELEVANCE[key];
    if (pattern && !pattern.test(lower)) {
      const reKey = matchKey(q);
      const reText = QA_BANK[reKey] || QA_BANK.default;
      if (reKey === 'political_guard') {
        return { key: reKey, text: reText, isUnverified: false };
      }
      return { key: reKey, text: reText, isUnverified: reKey === 'unverified' };
    }
  }

  return { key, text, isUnverified: key === 'unverified' };
}

const tests = [
  { id: "1. First-time voter", msg: "I've never voted before, how do I sign up?" },
  { id: "2. Rural user", msg: "I live out in the country, how do I get a mail-in ballot?" },
  { id: "3. User without voter ID", msg: "I don't have a photo ID or driver's license. Can I still vote?" },
  { id: "4. Late registration case", msg: "I missed the deadline to register, what can I do?" },
  { id: "5. Confused user", msg: "Who should I vote for? I'm completely lost!" }
];

console.log("=== CIVIC NAVIGATOR TEST RESULTS ===");
for (const t of tests) {
  const key = matchKey(t.msg);
  const text = QA_BANK[key] || QA_BANK.default;
  const result = validateChatResponse(t.msg, key, text);
  
  console.log(`\nUser Profile: ${t.id}`);
  console.log(`Input: "${t.msg}"`);
  console.log(`Matched Key: ${result.key}`);
  console.log(`Correctness Check: ${result.text === text ? 'PASS' : 'FAIL (reverted to default or modified)'}`);
  console.log(`Response Output:`);
  console.log(result.text.replace(/##section##/g, '').trim());
  if (result.key === 'default' && t.id !== "4. Late registration case") {
    // Note: Late registration doesn't have a specific keyword in our basic regexes unless it hits 'register'
  }
}
