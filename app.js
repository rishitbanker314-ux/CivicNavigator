'use strict';

/* ── ECI Process Steps ── */
const ECI_STEPS = [
  {
    num: 1, icon: '📋', title: 'Check Eligibility',
    desc: 'You must be an Indian citizen, aged 18+ on the qualifying date, and ordinarily resident in a constituency. Non-residents and certain disqualified persons cannot register.',
    link: 'https://eci.gov.in', linkText: 'ECI Eligibility Rules',
    badge: 'ECI Mandatory'
  },
  {
    num: 2, icon: '📝', title: 'NVSP Registration (Form 6)',
    desc: 'Register on the National Voters\' Service Portal (nvsp.in) using Form 6. Upload proof of age, address, and a passport-size photo. You will receive an acknowledgement number.',
    link: 'https://nvsp.in', linkText: 'Go to NVSP',
    badge: 'ECI Mandatory'
  },
  {
    num: 3, icon: '🔍', title: 'Electoral Roll Verification',
    desc: 'After registration, verify your name on the Electoral Roll at electoralsearch.in. Check your Part Number and Serial Number — these are needed on Polling Day.',
    link: 'https://electoralsearch.in', linkText: 'Search Electoral Roll',
    badge: 'ECI Mandatory'
  },
  {
    num: 4, icon: '📍', title: 'Booth Assignment (Polling Booth)',
    desc: 'Your Polling Booth is assigned based on your registered address and constituency. Find your booth number and address from your EPIC or on voters.eci.gov.in.',
    link: 'https://voters.eci.gov.in', linkText: 'Voter Service Portal',
    badge: 'ECI Mandatory'
  },
  {
    num: 5, icon: '🗳️', title: 'EVM Voting with EPIC',
    desc: 'On election day, carry your EPIC (Electors Photo Identity Card) or any of the 12 ECI-approved alternate IDs. Vote using the Electronic Voting Machine (EVM) at your assigned Polling Booth.',
    link: 'https://eci.gov.in', linkText: 'EVM Voting Guide',
    badge: 'ECI Mandatory'
  }
];

/* ── Stage Actions ── */
const STAGE_ACTIONS = [
  {
    icon: '📋',
    stage: 'Stage 1 of 5 — Not Registered',
    title: 'You need to register as a voter',
    desc: 'Visit nvsp.in and fill Form 6. You\'ll need: proof of age (birth certificate / school certificate / passport), proof of address (Aadhaar / ration card / utility bill), and a passport-size photo.',
    risk: 'High Risk — Unregistered voters cannot cast their vote on EVM.',
    riskDot: 'risk-dot-red',
    actions: [
      { label: 'Register on NVSP', href: 'https://nvsp.in', primary: true },
      { label: 'Check Eligibility', href: '#eligibility', primary: false }
    ]
  },
  {
    icon: '📝',
    stage: 'Stage 2 of 5 — Registered',
    title: 'Verify your name on the Electoral Roll',
    desc: 'Your Form 6 has been submitted. Now verify your name appears on the Electoral Roll at electoralsearch.in. Note your Part No. and Serial No. for Polling Day.',
    risk: 'Medium Risk — Name may not yet appear; allow 4–6 weeks post-registration.',
    riskDot: 'risk-dot-amber',
    actions: [
      { label: 'Search Electoral Roll', href: 'https://electoralsearch.in', primary: true },
      { label: 'Track Application', href: 'https://nvsp.in', primary: false }
    ]
  },
  {
    icon: '✅',
    stage: 'Stage 3 of 5 — Roll Verified',
    title: 'Find your assigned Polling Booth',
    desc: 'Your name is on the Electoral Roll. Next, confirm your Polling Booth address and Booth number. Carry your EPIC or an approved alternate ID on election day.',
    risk: 'Low Risk — Ensure your EPIC is valid and you know your Booth address.',
    riskDot: 'risk-dot-amber',
    actions: [
      { label: 'Find My Booth', href: 'https://voters.eci.gov.in', primary: true },
      { label: 'Download EPIC', href: 'https://nvsp.in', primary: false }
    ]
  },
  {
    icon: '🗳️',
    stage: 'Stage 4 of 5 — Ready to Vote',
    title: 'You\'re ready to vote via EVM!',
    desc: 'Carry your EPIC to your assigned Polling Booth. The Presiding Officer will verify your name and mark your finger with indelible ink. Then press the button next to your candidate on the EVM.',
    risk: 'Minimal Risk — Check election date and voting hours in your constituency.',
    riskDot: 'risk-dot-green',
    actions: [
      { label: 'EVM Voting Guide', href: 'https://eci.gov.in', primary: true },
      { label: 'Voter Helpline: 1950', href: 'tel:1950', primary: false }
    ]
  }
];

/* ── Risk Items ── */
const RISKS = [
  { icon: '⚠️', sev: 'high', sevLabel: 'High', title: 'Name Not on Electoral Roll', desc: 'The most common issue — if your name isn\'t on the roll, you cannot vote even if you have an EPIC.', fix: 'Fix: Verify at electoralsearch.in at least 30 days before election day.' },
  { icon: '🪪', sev: 'high', sevLabel: 'High', title: 'Expired or Damaged EPIC', desc: 'An unreadable EPIC will be rejected at the Polling Booth. You must carry a valid ID.', fix: 'Fix: Apply for a duplicate EPIC on NVSP or carry an alternate ECI-approved ID.' },
  { icon: '📍', sev: 'med', sevLabel: 'Medium', title: 'Wrong Polling Booth', desc: 'Voters must vote at their assigned Booth — you cannot vote at a different Booth even in the same constituency.', fix: 'Fix: Confirm your exact Booth number on voters.eci.gov.in before election day.' },
  { icon: '⏰', sev: 'med', sevLabel: 'Medium', title: 'Missing the Deadline', desc: 'Voter registration has a cutoff date before each election. Late applications are rejected.', fix: 'Fix: Register on NVSP at least 60 days before the expected election date.' },
  { icon: '📱', sev: 'med', sevLabel: 'Medium', title: 'Incorrect Address on Roll', desc: 'If you\'ve moved, your old address may place you in the wrong constituency.', fix: 'Fix: Update address via Form 8A on NVSP before the registration deadline.' },
  { icon: '🖋️', sev: 'low', sevLabel: 'Low', title: 'Indelible Ink Mark from Previous Vote', desc: 'BLOs may flag voters with existing ink marks as having already voted.', fix: 'Fix: Ensure ink from a previous election has fully faded; this is usually not an issue.' }
];

/* ── Eligibility Questions ── */
const ELIG_QS = [
  {
    q: 'Are you a citizen of India?',
    opts: ['Yes, I am an Indian citizen', 'No, I am not'],
    fail: [1], failMsg: 'Only Indian citizens can register as voters under the Representation of the People Act, 1950.'
  },
  {
    q: 'Are you 18 years of age or older on the qualifying date (1st January of the registration year)?',
    opts: ['Yes, I am 18 or older', 'No, I am under 18'],
    fail: [1], failMsg: 'You must be at least 18 years old on the qualifying date (1st January) to register as a voter.'
  },
  {
    q: 'Are you ordinarily resident in the constituency where you wish to register?',
    opts: ['Yes, I reside there', 'No, I live elsewhere'],
    fail: [1], failMsg: 'You must be ordinarily resident in the constituency. You should register at your actual place of residence.'
  },
  {
    q: 'Are you of sound mind and not disqualified by any law (e.g. not serving a criminal sentence that bars voting)?',
    opts: ['Yes, I am not disqualified', 'No / Unsure'],
    fail: [1], failMsg: 'Certain legal disqualifications under Sections 16–17 of the Representation of the People Act may prevent registration. Consult the ECI or a legal advisor.'
  }
];

/* ── AI Knowledge Base ── */
const AI_KB = {
  'epic': 'EPIC stands for Electors Photo Identity Card — the official voter ID issued by the Election Commission of India. It is the primary document required at the Polling Booth on election day. If your EPIC is lost or damaged, apply for a duplicate on nvsp.in using Form 002.',
  'evm': 'EVM stands for Electronic Voting Machine. It is used in all Indian elections. On election day, you press the button next to your candidate\'s name/symbol on the EVM. A separate VVPAT (Voter Verifiable Paper Audit Trail) machine lets you verify your vote was recorded correctly.',
  'nvsp': 'NVSP (National Voters\' Service Portal) at nvsp.in is the official ECI portal for all voter services — new registration (Form 6), address change (Form 8A), corrections (Form 8), and downloading your EPIC.',
  'form 6': 'Form 6 is the application form for new voter registration in India. Fill it on nvsp.in with your proof of age, proof of address, and a passport-size photo. You\'ll get an acknowledgement number to track your application.',
  'electoral roll': 'The Electoral Roll is the official list of registered voters in each constituency, maintained by the Election Commission of India. Verify your name at electoralsearch.in. Note your Part Number and Serial Number — these are referenced by the Polling Booth officer on election day.',
  'polling booth': 'Your Polling Booth is the specific voting centre assigned to you based on your registered address. You can only vote at your assigned Polling Booth. Find yours on voters.eci.gov.in or printed on your EPIC slip.',
  'constituency': 'A constituency (also called a Polling Division or Vidhan Sabha/Lok Sabha Constituency) is the geographic area you are registered in. India has 28 State/UTs and 8 Union Territories, divided into Lok Sabha (543) and Vidhan Sabha constituencies.',
  'pin code': 'In India, we use PIN Codes (6-digit Postal Index Numbers) instead of Zip Codes. When looking for your Polling Booth, you can use your PIN Code or constituency name on voters.eci.gov.in.',
  'electoralsearch': 'Visit electoralsearch.in (official ECI site) to search if your name is on the Electoral Roll. You can search by name, EPIC number, or address. This is a critical step before election day.',
  'register': 'To register as a voter: 1) Visit nvsp.in 2) Click "New Registration — Form 6" 3) Fill in your details 4) Upload proof of age, address, and photo 5) Submit and note your acknowledgement number. Allow 4–6 weeks for processing.',
  'eligibility': 'To vote in India you must be: 1) An Indian citizen 2) At least 18 years old on the qualifying date (January 1st) 3) Ordinarily resident in your constituency 4) Not disqualified under the Representation of the People Act, 1950.',
  'vvpat': 'VVPAT (Voter Verifiable Paper Audit Trail) is a device connected to the EVM that prints a paper slip showing your vote for 7 seconds. This lets you verify your vote was correctly recorded before the slip is automatically cut and stored in a sealed container.',
  'alternate id': 'If you don\'t have your EPIC on election day, ECI accepts 12 alternate photo IDs including: Aadhaar Card, Passport, Driving Licence, PAN Card, MNREGA Job Card, Smart Card issued by RGI, Pension document with photo, Bank / Post Office Passbook with photo, and more.'
};

function getAIResponse(q) {
  const lower = q.toLowerCase();
  for (const [key, val] of Object.entries(AI_KB)) {
    if (lower.includes(key)) return val;
  }
  if (lower.includes('help') || lower.includes('what')) {
    return 'CivicNavigator covers the full ECI voting process for Indian elections. Ask me about: EPIC card, NVSP registration, Form 6, Electoral Roll verification, Polling Booth, EVM voting, eligibility criteria, or constituency details.';
  }
  return 'This question is best answered by the official ECI resources. Please visit eci.gov.in, nvsp.in, or call the National Voter Helpline at 1950 for authoritative guidance specific to your constituency and State/UT.';
}

/* ── Journey Stage Data ── */
const JOURNEY_STAGES = [
  {
    name: 'Register',
    desc: 'Submit Form 6 on NVSP (nvsp.in) with your proof of age, address, and photo to register as a voter.',
    btnLabel: 'Complete Registration →',
    btnHref: 'https://nvsp.in'
  },
  {
    name: 'Verify',
    desc: 'Check that your name appears on the Electoral Roll at electoralsearch.in. Note your Part and Serial numbers.',
    btnLabel: 'Verify on Electoral Roll →',
    btnHref: 'https://electoralsearch.in'
  },
  {
    name: 'Find Booth',
    desc: 'Locate your assigned Polling Booth using your EPIC or the Voter Service Portal at voters.eci.gov.in.',
    btnLabel: 'Find My Polling Booth →',
    btnHref: 'https://voters.eci.gov.in'
  },
  {
    name: 'Vote',
    desc: 'Carry your EPIC to your Polling Booth on election day. Cast your vote on the EVM and verify via VVPAT.',
    btnLabel: 'View EVM Voting Guide →',
    btnHref: 'https://eci.gov.in'
  }
];

/* ── Risk Assessment Data (per journey stage) ── */
const RISK_DATA = [
  {
    stage: 'Not Registered', stageNote: 'You need to register to vote',
    risk: 'HIGH', pillClass: 'ra-pill-high', riskNote: 'Your vote may be at risk', riskNoteClass: 'ra-note-red',
    issue: 'Registration Incomplete', issueNote: 'Act now to protect your vote', issueNoteClass: 'ra-note-amber',
    consequence: 'You will not be able to cast your vote on election day. Your name will not appear on the electoral roll and booth officials cannot help you.'
  },
  {
    stage: 'Registered', stageNote: 'Form 6 submitted — pending verification',
    risk: 'MEDIUM', pillClass: 'ra-pill-med', riskNote: 'Verification still pending', riskNoteClass: 'ra-note-amber',
    issue: 'Roll Not Confirmed', issueNote: 'Verify before the deadline', issueNoteClass: 'ra-note-amber',
    consequence: 'If your name does not appear on the Electoral Roll, you will be turned away at the Polling Booth even if you have an EPIC card.'
  },
  {
    stage: 'Roll Verified', stageNote: 'Name confirmed on Electoral Roll',
    risk: 'LOW', pillClass: 'ra-pill-low', riskNote: 'On track to vote', riskNoteClass: 'ra-note-amber',
    issue: 'Booth Not Located', issueNote: 'Find your booth before election day', issueNoteClass: 'ra-note-amber',
    consequence: 'Arriving at the wrong Polling Booth means you cannot vote — booth officers can only serve voters assigned to their booth.'
  },
  {
    stage: 'Ready to Vote', stageNote: 'Booth assigned — carry your EPIC',
    risk: 'MINIMAL', pillClass: 'ra-pill-low', riskNote: 'You are fully prepared', riskNoteClass: '',
    issue: 'None', issueNote: 'Check election date and hours', issueNoteClass: 'ra-note-amber',
    consequence: 'Even fully prepared voters can miss their chance if they arrive after polling hours end. Confirm your constituency\'s voting time on eci.gov.in.'
  }
];

function updateRiskAssessment(idx) {
  const d = RISK_DATA[idx];
  const el = (id) => document.getElementById(id);
  const stageVal = el('ra-stage-value');
  if (!stageVal) return;
  stageVal.textContent = d.stage;
  stageVal.removeAttribute('style');
  el('ra-stage-note').textContent = d.stageNote;
  const pill = el('ra-risk-pill');
  pill.textContent = d.risk;
  pill.className = 'ra-risk-pill ' + d.pillClass;
  pill.removeAttribute('style'); // remove default styling
  const rn = el('ra-risk-note');
  rn.textContent = d.riskNote;
  rn.className = 'ra-card-note ' + d.riskNoteClass;
  
  const issueVal = el('ra-issue-value');
  issueVal.textContent = d.issue;
  issueVal.removeAttribute('style'); // remove default styling
  
  const inote = el('ra-issue-note');
  inote.textContent = d.issueNote;
  inote.className = 'ra-card-note ' + d.issueNoteClass;
  el('ra-consequence-text').textContent = d.consequence;
}

/* ── Action Plan Steps ── */
const ACTION_PLAN_STEPS = [
  { name: 'Check Eligibility', desc: 'Confirm you are 18+, Indian citizen, and resident of your constituency' },
  { name: 'Register on NVSP', desc: 'Submit Form 6 on nvsp.in or via the Voter Helpline App', href: 'https://nvsp.in' },
  { name: 'Verify Electoral Roll', desc: 'Confirm your name at electoralsearch.eci.gov.in before the final roll date', href: 'https://electoralsearch.eci.gov.in' },
  { name: 'Receive EPIC', desc: 'Download or collect your Electors Photo Identity Card', href: 'https://nvsp.in' },
  { name: 'Locate Polling Booth', desc: 'Find your assigned booth via the ECI Booth App or Google Maps', href: 'https://voters.eci.gov.in' },
  { name: 'Cast Your Vote', desc: 'Vote using the Electronic Voting Machine (EVM) at your assigned booth on election day' }
];

function renderActionPlan(activeJourneyIdx) {
  const container = document.getElementById('ap-steps');
  if (!container) return;
  // Map journey stage (0-3) to action plan active step (1-4), stage 0 = step 1 active
  const activeStep = activeJourneyIdx + 1;
  if (activeJourneyIdx === -1) {
    // Keep the default HTML state for action plan, do not overwrite
    return;
  }
  
  container.innerHTML = `
    <div class="ap-empty-state">
      <h3 class="ap-default-title" style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 4px;">Your Personalized Plan</h3>
      <p class="ap-default-desc" style="font-size: 14px; color: #6B7280; margin-bottom: 16px;">Based on your current stage:</p>
    </div>
  ` + ACTION_PLAN_STEPS.map((step, i) => {
    const done = i < activeStep;
    const active = i === activeStep;
    const icon = done ? '✅' : active ? '⏳' : '⬜';
    const cls = active ? ' ap-active' : '';
    const btn = active && step.href
      ? `<a href="${step.href}" target="_blank" rel="noopener noreferrer" class="ap-step-btn">Start →</a>`
      : '';
    return `
      <div class="ap-step${cls}">
        <span class="ap-step-icon">${icon}</span>
        <div class="ap-step-body">
          <div class="ap-step-name">${step.name}</div>
          <div class="ap-step-desc">${step.desc}</div>
        </div>
        ${btn}
      </div>`;
  }).join('');
}

/* ── My Voting Journey ── */
function initJourney() {
  const nodes = document.querySelectorAll('.jp-node');
  const lines = document.querySelectorAll('.jp-line');
  const card = document.getElementById('journey-card');
  if (!nodes.length || !card) return;

  function setStage(activeIdx) {
    nodes.forEach((node, i) => {
      const circle = node.querySelector('.jp-circle');
      node.classList.remove('jp-completed', 'jp-active');
      node.setAttribute('aria-pressed', 'false');
      if (i < activeIdx) {
        node.classList.add('jp-completed');
        circle.textContent = '✓';
      } else if (i === activeIdx) {
        node.classList.add('jp-active');
        node.setAttribute('aria-pressed', 'true');
        circle.textContent = String(i + 1);
      } else {
        circle.textContent = String(i + 1);
      }
    });
    lines.forEach((line, i) => {
      line.classList.remove('jp-line-done', 'jp-line-active');
      if (i < activeIdx) line.classList.add('jp-line-done');
      else if (i === activeIdx) line.classList.add('jp-line-active');
    });
    if (activeIdx === -1) {
      card.innerHTML = `
        <div class="jc-stage-label" style="color: #6B7280; font-weight: 500;">Please select your voting stage above</div>
      `;
      // Don't update risk assessment or action plan if -1
      return;
    }
    const data = JOURNEY_STAGES[activeIdx];
    card.innerHTML = `
      <div class="jc-stage-label">Current Stage: <strong>${data.name}</strong></div>
      <div class="jc-desc">${data.desc}</div>
      <a href="${data.btnHref}" target="_blank" rel="noopener noreferrer" class="jc-btn">${data.btnLabel}</a>
    `;
    // Update dependent sections
    updateRiskAssessment(activeIdx);
    renderActionPlan(activeIdx);
  }

  nodes.forEach(node => {
    node.addEventListener('click', () => {
      setStage(parseInt(node.dataset.stage, 10));
    });
  });

  // Start with no stage selected (-1 means default HTML state is preserved)
  setStage(-1);
}

/* ── Render: ECI Process Steps ── */
function renderProcessSteps() {
  const grid = document.getElementById('process-steps');
  if (!grid) return;
  grid.innerHTML = ECI_STEPS.map(s => `
    <article class="process-card" role="listitem">
      <div class="pc-number">${s.num}</div>
      <span class="pc-badge pc-badge-eci">${s.badge}</span>
      <div class="pc-icon">${s.icon}</div>
      <h3 class="pc-title">${s.title}</h3>
      <p class="pc-desc">${s.desc}</p>
      <a href="${s.link}" target="_blank" rel="noopener noreferrer" class="pc-link">${s.linkText} ↗</a>
    </article>
  `).join('');
}

/* ── Render: Risk Grid ── */
function renderRisks() {
  const grid = document.getElementById('risk-grid');
  if (!grid) return;
  grid.innerHTML = RISKS.map(r => `
    <div class="risk-card" role="listitem">
      <div class="risk-card-icon">${r.icon}</div>
      <div class="risk-card-body">
        <span class="risk-card-sev sev-${r.sev}">${r.sevLabel} Risk</span>
        <div class="risk-card-title">${r.title}</div>
        <div class="risk-card-desc">${r.desc}</div>
        <div class="risk-card-fix">${r.fix}</div>
      </div>
    </div>
  `).join('');
}

/* ── Status Selector ── */
function initStatusSelector() {
  const btns = document.querySelectorAll('.status-btn');
  const card = document.getElementById('status-action-card');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-checked', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      const stage = parseInt(btn.dataset.stage, 10);
      const data = STAGE_ACTIONS[stage];
      card.style.display = 'block';
      card.innerHTML = `
        <div class="sac-inner">
          <div class="sac-icon">${data.icon}</div>
          <div class="sac-body">
            <div class="sac-stage">${data.stage}</div>
            <div class="sac-title">${data.title}</div>
            <div class="sac-desc">${data.desc}</div>
            <div class="sac-actions">
              ${data.actions.map(a => `<a href="${a.href}" ${a.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''} class="sac-btn ${a.primary ? 'sac-btn-primary' : 'sac-btn-secondary'}">${a.label}</a>`).join('')}
            </div>
            <div class="sac-risk">
              <span class="risk-dot ${data.riskDot}"></span>
              <span>${data.risk}</span>
            </div>
          </div>
        </div>
      `;
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });
}

/* ── Eligibility Checker ── */
function initEligibility() {
  let qi = 0;
  const area = document.getElementById('elig-question-area');
  const result = document.getElementById('elig-result');
  const bar = document.getElementById('elig-progress-bar');
  const prog = document.getElementById('elig-progress');

  function render() {
    if (qi >= ELIG_QS.length) {
      area.style.display = 'none';
      result.style.display = 'block';
      bar.style.width = '100%';
      prog.setAttribute('aria-valuenow', '100');
      result.innerHTML = `<div class="elig-result-inner">
        <div class="elig-result-icon">✅</div>
        <div class="elig-result-title" style="color:var(--success)">You appear eligible to vote!</div>
        <div class="elig-result-desc">Based on your answers, you meet the basic ECI eligibility criteria. Register now on NVSP (nvsp.in) using Form 6 if you haven't already.</div>
        <a href="https://nvsp.in" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="margin:0 auto 16px;">Register on NVSP →</a><br/>
        <button class="elig-restart" id="elig-restart-btn">Restart Check</button>
      </div>`;
      document.getElementById('elig-restart-btn').addEventListener('click', () => { qi = 0; result.style.display = 'none'; area.style.display = 'block'; render(); });
      return;
    }
    const pct = Math.round((qi / ELIG_QS.length) * 100);
    bar.style.width = pct + '%';
    prog.setAttribute('aria-valuenow', pct);
    const q = ELIG_QS[qi];
    area.innerHTML = `
      <div class="elig-q-label">Question ${qi + 1} of ${ELIG_QS.length}</div>
      <div class="elig-q-text">${q.q}</div>
      <div class="elig-options">
        ${q.opts.map((o, i) => `<button class="elig-opt" data-idx="${i}">${o}</button>`).join('')}
      </div>`;
    area.querySelectorAll('.elig-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (q.fail.includes(idx)) {
          area.style.display = 'none'; result.style.display = 'block';
          result.innerHTML = `<div class="elig-result-inner">
            <div class="elig-result-icon">❌</div>
            <div class="elig-result-title" style="color:var(--risk)">Not Eligible</div>
            <div class="elig-result-desc">${q.failMsg}</div>
            <button class="elig-restart" id="elig-restart-btn">Try Again</button>
          </div>`;
          document.getElementById('elig-restart-btn').addEventListener('click', () => { qi = 0; result.style.display = 'none'; area.style.display = 'block'; render(); });
        } else { qi++; render(); }
      });
    });
  }
  render();
}

/* ── Polling Booth Locator ── */
function initLocator() {
  const btn = document.getElementById('find-booth-btn');
  const input = document.getElementById('pin-input');
  const resultEl = document.getElementById('locator-result');
  if (!btn) return;
  function search() {
    const val = input.value.trim();
    if (!val) { input.focus(); return; }
    resultEl.style.display = 'block';
    resultEl.innerHTML = `<p style="color:var(--text-secondary)">Redirecting you to the official ECI Electoral Search for "<strong>${val}</strong>"…</p>
      <p style="margin-top:8px;font-size:0.82rem;color:var(--text-tertiary)">CivicNavigator does not store voter data. All searches are performed directly on ECI's portal.</p>
      <a href="https://electoralsearch.in" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="margin-top:12px;display:inline-flex;">Open electoralsearch.in ↗</a>`;
  }
  btn.addEventListener('click', search);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') search(); });
}

/* ── Chat / AI Assistant ── */
function initChat() {
  const messages = document.getElementById('ai-messages');
  const form = document.getElementById('ai-form');
  const input = document.getElementById('ai-input');
  const prompts = document.getElementById('ai-prompts');
  if (!messages) return;

  function addMsg(text, role) {
    const div = document.createElement('div');
    div.className = `ai-msg ${role === 'bot' ? 'ai-bot' : 'ai-user'}`;
    div.innerHTML = `<div class="ai-bubble">${text}</div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function addTyping() {
    const div = document.createElement('div');
    div.className = 'ai-msg ai-bot'; div.id = 'ai-typing-indicator';
    div.innerHTML = `<div class="ai-bubble"><div class="ai-typing"><span></span><span></span><span></span></div></div>`;
    messages.appendChild(div); messages.scrollTop = messages.scrollHeight;
  }

  function ask(q) {
    addMsg(q, 'user');
    if (prompts) prompts.style.display = 'none';
    addTyping();
    setTimeout(() => {
      const t = document.getElementById('ai-typing-indicator');
      if (t) t.remove();
      addMsg(getAIResponse(q), 'bot');
      if (prompts) prompts.style.display = 'flex';
    }, 900 + Math.random() * 400);
  }

  // Welcome message
  addMsg('Namaste! 🙏 I\'m CivicNavigator. Tell me your State/UT or issue and I\'ll guide your exact next step — whether it\'s registration, verification, or finding your booth.', 'bot');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      input.value = '';
      ask(q);
    });
  }

  document.querySelectorAll('.ai-prompt-pill').forEach(pill => {
    pill.addEventListener('click', () => ask(pill.dataset.q));
  });
}

/* ── Mobile Nav ── */
function initMobileNav() {
  const toggle = document.getElementById('nav-mobile-toggle');
  const links = document.getElementById('nav-links');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  links.querySelectorAll('.nav-link').forEach(l => {
    l.addEventListener('click', () => { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); });
  });
}

/* ── Init ── */
/* ── Simulation Scenarios ── */
const SIM_SCENARIOS = [
  {
    good: "You're verified and ready to vote. Your booth will be assigned automatically.",
    bad: "Your name won't appear on the electoral roll. You cannot vote on election day. No exceptions."
  },
  {
    good: 'File Form 6 on NVSP. Your name gets added before the final roll is published.',
    bad: 'You will be turned away at the booth. Booth-level officers cannot add you on voting day.'
  },
  {
    good: '12 alternative documents are accepted by ECI including Aadhaar, Passport, and PAN card.',
    bad: 'Without valid ID, booth officials may deny your vote.'
  }
];

function initSimulation() {
  const container = document.getElementById('sim-cards');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.sim-btn');
    if (!btn) return;
    const card = btn.closest('.sim-card');
    const idx = parseInt(card.dataset.sim, 10);
    const choice = btn.dataset.choice; // 'good' or 'bad'
    const scenario = SIM_SCENARIOS[idx];
    const outcomeEl = document.getElementById('sim-outcome-' + idx);

    // Mark chosen / unchosen buttons
    card.querySelectorAll('.sim-btn').forEach(b => {
      b.classList.remove('sim-chosen', 'sim-unchosen');
      if (b === btn) b.classList.add('sim-chosen');
      else b.classList.add('sim-unchosen');
    });

    // Show outcome
    const isGood = choice === 'good';
    outcomeEl.innerHTML = `<div class="sim-outcome-inner ${isGood ? 'sim-outcome-good' : 'sim-outcome-bad'}">${isGood ? scenario.good : scenario.bad}</div>`;
    outcomeEl.classList.remove('sim-show');
    // Force reflow for re-animation
    void outcomeEl.offsetWidth;
    outcomeEl.classList.add('sim-show');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initJourney();
  renderProcessSteps();
  renderRisks();
  initStatusSelector();
  initEligibility();
  initLocator();
  initChat();
  initMobileNav();
  initSimulation();
});
