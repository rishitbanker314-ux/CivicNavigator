/* ===== CivicNavigator — App Logic ===== */
(function () {
  'use strict';

  // ─── SYSTEM DIRECTIVE ───────────────────────────────────────────────────────
  // This system operates EXCLUSIVELY under Election Commission of India (ECI)
  // standards. All responses must conform to these rules before being rendered.
  const SYSTEM_DIRECTIVE = {
    name:    'Indian Election Decision Intelligence System',
    source:  'eci.gov.in',
    terms:   ['EPIC', 'EVM', 'Constituency', 'Polling Booth', 'NVSP', 'Form 6', 'Form 8', 'Form 12D', 'Tendered Ballot', 'VVPAT'],
    blocked: ['ballot box', 'absentee ballot (general)', 'county', 'state legislature', 'senator', 'president', 'congress (US)', 'vote.gov', 'election day (US)'],
    rules: [
      'Only Indian election system (eci.gov.in standards)',
      'Use terms: EPIC (Voter ID), EVM, Constituency, Polling Booth',
      'No US or foreign references whatsoever',
      'No assumptions about specific dates or policies — say "Please verify with official ECI sources."',
      'Foreign election queries must be rejected with: "This system is designed only for Indian elections."',
      'Location-unspecified queries must prompt: "Which state or city in India are you from?"',
      'Political endorsement queries must respond: "I can only help you learn how to vote, not who to vote for."'
    ]
  };

  /**
   * enforceDirective(text)
   * Scans any outgoing response for foreign terms.
   * If found, replaces with the safe ECI fallback.
   */
  function enforceDirective(text) {
    const foreignPatterns = [
      /\bvote\.gov\b/gi,
      /\belection day\b(?!.*india)/gi,
      /\bcounty\b/gi,
      /\bstate legislature\b/gi,
      /\bmail-in ballot\b/gi,
      /\babsentee ballot\b(?!.*form 12d|.*postal)/gi,
      /\bsenator\b/gi,
      /\bcongressman\b/gi,
      /\brepublican\b|\bdemocrat\b/gi,
      /\bu\.s\.\s*(citizen|election|voter)/gi
    ];
    let clean = text;
    foreignPatterns.forEach(p => {
      if (p.test(clean)) {
        clean = '##section## 📋 Situation\nA non-Indian electoral term was detected in this response.\n\n##section## ⚡ What You Should Do\n• Please verify with official ECI sources.';
      }
    });
    return clean;
  }

  // ─── DATA ───

  const GUIDE_STEPS = [
    {
      title: 'Eligibility Check',
      body: 'Verify you meet the basic requirements: Indian citizenship, age (18+), and residency in the constituency where you plan to vote.',
      details: [
        'You must be an Indian citizen.',
        'You must be 18 years old by the qualifying date.',
        'You must meet your constituency\'s residency requirements.',
        'Check ECI\'s specific rules regarding disqualification.'
      ]
    },
    {
      title: 'Voter Registration',
      body: 'Register online via NVSP / ECI portal or Voter Helpline App before the roll freezes.',
      details: [
        'Visit the NVSP / ECI portal for official registration (Form 6).',
        'Deadlines apply — typically roll freezes before nominations.',
        'You\'ll need your name, address proof, age proof, and a photo.',
        'All states require voter registration.'
      ]
    },
    {
      title: 'Registration Verification',
      body: 'After registering, verify your status is active and your details are correct via the NVSP / ECI portal.',
      details: [
        'Use the ECI official Electoral Search lookup tool.',
        'Confirm your name, address, and EPIC number are correct.',
        'If there are errors, submit Form 8 via NVSP / ECI portal.'
      ]
    },
    {
      title: 'Polling Booth Identification',
      body: 'Find your assigned polling booth using the ECI Booth Locator. Confirm Part Number and Serial Number.',
      details: [
        'Your polling booth is based on your registered address.',
        'Use the NVSP / ECI portal website.',
        'Polling hours vary by constituency.',
        'Arrive prepared: know your Part Number and Serial Number.'
      ]
    },
    {
      title: 'Voting Process',
      body: 'Cast your vote in person using EVM voting — following ECI official instructions.',
      details: [
        'Check what identification is required (EPIC, Aadhaar, PAN, etc.).',
        'Press the EVM button clearly and check the VVPAT slip.',
        'If there is an EVM error, alert the Presiding Officer immediately.',
        'You have the right to vote if you are in line when polls close.'
      ]
    },
    {
      title: 'Result Awareness',
      body: 'Official results are announced by the Election Commission of India. Only check official government sources for verified results.',
      details: [
        'Initial trends are reported on Counting Day, but wait for final numbers.',
        'Official certified results are published after all EVM voting data is counted.',
        'Timing of certification varies — check the NVSP / ECI portal.',
        'Do not rely on exit polls or unofficial sources for final results.'
      ]
    }
  ];

  const ELIGIBILITY_QUESTIONS = [
    {
      q: 'Are you a citizen of India?',
      sub: 'Indian citizenship is required to vote in national and state elections.',
      options: ['Yes', 'No'],
      failOn: 'No',
      failMsg: 'Only Indian citizens are eligible to vote in these elections.'
    },
    {
      q: 'Will you be at least 18 years old on the qualifying date?',
      sub: 'The minimum voting age in India is 18 years.',
      options: ['Yes', 'No, I\'m under 18'],
      failOn: 'No, I\'m under 18',
      failMsg: 'You must be 18 years old to be enrolled in the electoral roll.'
    },
    {
      q: 'Are you an ordinarily resident at your current address?',
      sub: 'You must be registered in the constituency where you reside.',
      options: ['Yes', 'I\'m not sure', 'No'],
      failOn: 'No',
      failMsg: 'You must be a resident of the constituency where you plan to vote. Use Form 8 to shift your address.'
    },
    {
      q: 'Is your name on the electoral roll?',
      sub: 'You must be on the voter list to participate in EVM voting.',
      options: ['Yes, I checked', 'Not yet, but I plan to apply', 'I don\'t know'],
      infoOn: 'I don\'t know',
      infoMsg: 'Visit the Election Commission of India (ECI) Voter Portal to search your name in the electoral roll.'
    }
  ];

  const SCENARIOS = [
    {
      title: 'Step 1: Eligibility Check',
      situation: 'Elections are approaching. You want to vote, but you must confirm your eligibility first.',
      choices: [
        {
          text: 'I am an Indian citizen, 18+ years old, and reside in my constituency.',
          result: 'Correct! You meet the requirements to apply for a Voter ID (EPIC). Moving to the next step.',
          correct: true
        },
        {
          text: 'I am a permanent resident (OCI or NRI).',
          result: 'Incorrect. Only resident Indian citizens and registered NRI voters can vote. OCI cardholders cannot vote.',
          correct: false
        }
      ]
    },
    {
      title: 'Step 2: Voter Registration',
      situation: 'You are eligible to vote. Now you need to make sure you are registered before the deadline.',
      choices: [
        {
          text: 'I will assume I am registered and just show up with my Aadhaar card on Election Day.',
          result: 'Not recommended! Having an Aadhaar card does not mean you are on the electoral roll.',
          correct: false
        },
        {
          text: 'I will fill out Form 6 on the ECI Voter Portal to get my name on the roll and get my EPIC.',
          result: 'Correct! Registering early ensures you are on the voter roll.',
          correct: true
        }
      ]
    },
    {
      title: 'Step 3: Registration Verification',
      situation: 'You submitted your Form 6 a few weeks ago.',
      choices: [
        {
          text: 'I will verify my registration status by searching my name on the ECI electoral roll search.',
          result: 'Correct! It is always best to verify your status and EPIC number are active.',
          correct: true
        },
        {
          text: 'I will wait for my Voter ID card to arrive by post.',
          result: 'Risky! Cards can be delayed. Always verify your status online proactively.',
          correct: false
        }
      ]
    },
    {
      title: 'Step 4: Polling Booth Identification',
      situation: 'It is almost Election Day. You need to figure out where your booth is.',
      choices: [
        {
          text: 'I will go to the nearest school or community center.',
          result: 'Incorrect! You must go to your specifically assigned polling booth based on your part number.',
          correct: false
        },
        {
          text: 'I will use the ECI portal or Voter Helpline App to find my assigned polling booth.',
          result: 'Correct! This ensures you go to the right location to cast your vote.',
          correct: true
        }
      ]
    },
    {
      title: 'Step 5: Voting Process',
      situation: 'You are at the EVM (Electronic Voting Machine) and realize you pressed the wrong button.',
      choices: [
        {
          text: 'I will press the correct button now to change my vote.',
          result: 'Incorrect! Once a button is pressed and the beep is heard, the vote is cast and cannot be changed.',
          correct: false
        },
        {
          text: 'I will look at the VVPAT slip to confirm my vote, but understand I cannot change it after pressing.',
          result: 'Correct! The VVPAT prints a slip to verify your choice, but you only get one press on the EVM.',
          correct: true
        }
      ]
    },
    {
      title: 'Step 6: Result Awareness',
      situation: 'Voting has ended, and news channels are showing exit polls.',
      choices: [
        {
          text: 'I will wait for the ECI official counting day for certified results.',
          result: 'Correct! Exit polls are preliminary. Only certified ECI results are final.',
          correct: true
        },
        {
          text: 'I will trust the exit polls since they ask voters directly.',
          result: 'Incorrect! Exit polls are predictions. Official counting happens on a designated day.',
          correct: false
        }
      ]
    }
  ];

  const TIMELINE_DATA = [
    { order: 'Step 1', name: 'Eligibility Check', when: 'Before Enrollment', action: 'Confirm you meet Indian citizenship, age (18+), and constituency residency requirements.' },
    { order: 'Step 2', name: 'Voter Registration', when: 'Before Roll Freeze', action: 'Submit Form 6 online via ECI portal or Voter Helpline App.' },
    { order: 'Step 3', name: 'Registration Verification', when: 'After Submission', action: 'Verify your name in the electoral roll and note your EPIC number.' },
    { order: 'Step 4', name: 'Polling Booth Identification', when: 'A Few Days Before Election', action: 'Use the ECI locator to find your Part Number and assigned Polling Booth.' },
    { order: 'Step 5', name: 'Voting Process', when: 'On Polling Day', action: 'Show your EPIC, press the EVM button, and check the VVPAT slip.' },
    { order: 'Step 6', name: 'Result Awareness', when: 'On Counting Day', action: 'Check ECI official website for certified counting results.' }
  ];

  const QA_BANK = {
    'eligibility': '##section## 📋 Situation\n• Mistakes: Assuming you are eligible without checking.\n• Missing steps: Need to verify age and residency.\n• Risks: Being turned away at enrollment.\n\n##section## 🟢 Risk Level\n• Low\n• Checking eligibility is informational only.\n\n##section## 🟠 What Could Go Wrong\nAssuming you are eligible without checking can lead to denied enrollment.\n\n##section## ⚡ What You Should Do\n• Visit ECI Voter Portal\n• Check age and residency rules\n• Confirm Indian citizenship',
    'register': '##section## 📋 Situation\n• Mistakes: Missing the enrollment deadline.\n• Missing steps: Need to submit Form 6.\n• Risks: Name will not be on the electoral roll.\n\n##section## 🔴 Risk Level\n• High\n• Missing the deadline before the roll freezes means you cannot vote.\n\n##section## 🟠 What Could Go Wrong\nNot filing Form 6 in time means no vote in the upcoming election.\n\n##section## ⚡ What You Should Do\n• Go to ECI Voter Portal or use Voter Helpline App\n• Fill out Form 6\n• Submit with address and age proof',
    'verify': '##section## 📋 Situation\n• Mistakes: Assuming name is on the roll without checking.\n• Missing steps: Need to search Electoral Roll.\n• Risks: Name deleted or wrong booth assigned.\n\n##section## 🟡 Risk Level\n• Medium\n• May cause delays or denial at the booth.\n\n##section## 🟠 What Could Go Wrong\nAn outdated address or deleted name means you cannot cast your vote.\n\n##section## ⚡ What You Should Do\n• Go to ECI Electoral Search\n• Search your name or EPIC number\n• Confirm details match your ID',
    'polling': '##section## 📋 Situation\n• Mistakes: Going to the wrong booth or arriving late.\n• Missing steps: Need to find Part Number and Booth Location.\n• Risks: Denied entry to vote.\n\n##section## 🟡 Risk Level\n• Medium\n• Going to the wrong booth can prevent voting via EVM.\n\n##section## 🟠 What Could Go Wrong\nArriving after polling hours means you cannot vote at all.\n\n##section## ⚡ What You Should Do\n• Use ECI Booth Locator\n• Note Part Number and Serial Number\n• Plan route before Polling Day',
    'id': '##section## 📋 Situation\n• Mistakes: Forgetting EPIC or bringing unapproved ID.\n• Missing steps: Need to check approved ECI ID list.\n• Risks: Not allowed to press EVM.\n\n##section## 🟡 Risk Level\n• Medium\n• Missing EPIC or valid ID stops you at the booth.\n\n##section## 🟠 What Could Go Wrong\nBringing an unacceptable ID will result in the polling officer denying your vote.\n\n##section## ⚡ What You Should Do\n• Check ECI list of approved IDs\n• Bring original valid ID to the booth',
    'mail': '##section## 📋 Situation\n• Mistakes: Thinking anyone can vote by mail.\n• Missing steps: Need to submit Form 12D in time.\n• Risks: Postal ballot request rejected.\n\n##section## 🔴 Risk Level\n• High\n• Postal ballots are only for specific categories (senior citizens 85+, PwD, essential services).\n\n##section## 🟠 What Could Go Wrong\nNot submitting Form 12D within 5 days of election notification means no postal ballot.\n\n##section## ⚡ What You Should Do\n• Check if you fall in the absentee voter category\n• Fill Form 12D\n• Submit to the Returning Officer in time',
    'early': '##section## 📋 Situation\n• Mistakes: Assuming early voting exists like in other countries.\n• Missing steps: Need to verify Polling Day date.\n• Risks: Missing the actual Polling Day.\n\n##section## 🟢 Risk Level\n• Low\n• India generally does not have general early voting, only specific postal ballot provisions.\n\n##section## 🟠 What Could Go Wrong\nAssuming you can vote early like in other countries might make you miss Polling Day.\n\n##section## ⚡ What You Should Do\n• Confirm Polling Day for your constituency\n• Plan to vote on that specific date',
    'provisional': '##section## 📋 Situation\n• Mistakes: Leaving booth without filing a complaint.\n• Missing steps: Need to ask for Tendered Ballot.\n• Risks: Losing your right to vote.\n\n##section## 🔴 Risk Level\n• High\n• Leaving without checking your options means your vote is gone.\n\n##section## 🟠 What Could Go Wrong\nNot asking for a tendered ballot if someone impersonated you means you lose your right.\n\n##section## ⚡ What You Should Do\n• Talk to the Presiding Officer\n• Ask for a Tendered Ballot\n• Provide identity proof',
    'results': '##section## 📋 Situation\n• Mistakes: Trusting exit polls as final.\n• Missing steps: Need to check ECI certified results.\n• Risks: Misinformation.\n\n##section## 🟢 Risk Level\n• Low\n• Checking results is informational only.\n\n##section## 🟠 What Could Go Wrong\nTrusting exit polls can be misleading.\n\n##section## ⚡ What You Should Do\n• Go to the official ECI results portal on Counting Day\n• Look for declared results',
    'non_india': 'This system is designed only for Indian elections.',
    'location_guard': 'Which state or city in India are you from?',
    'political_guard': 'I can only help you learn how to vote, not who to vote for.',
    'unverified': '##section## 📋 Situation\n• Mistakes: Acting on unverified information.\n• Missing steps: Need to consult ECI.\n• Risks: Making wrong decisions based on bad data.\n\n##section## 🟡 Risk Level\n• Medium\n• Acting on unverified information can lead to mistakes.\n\n##section## 🟠 What Could Go Wrong\nUsing incorrect information might cause you to miss deadlines or go to the wrong booth.\n\n##section## ⚡ What You Should Do\n• Please verify with official ECI sources.',
    'default': '##section## 📋 Situation\n• Mistakes: Proceeding with incomplete data.\n• Missing steps: Need to clarify request.\n• Risks: Misinformation.\n\n##section## 🟡 Risk Level\n• Medium\n• Acting on incomplete information can lead to mistakes.\n\n##section## 🟠 What Could Go Wrong\nUsing incorrect information might cause you to miss deadlines or go to the wrong booth.\n\n##section## ⚡ What You Should Do\n• Please verify with official ECI sources.'
  };

  // ─── RISK PREDICTION BANK ───
  // Realistic, factual consequences of inaction per matched intent.
  const RISK_BANK = {
    register: {
      nothing:  'Your name will not be on the electoral roll.',
      wrong:    'Missing the enrollment deadline means you cannot vote until the next update.',
      impact:   'You lose your chance to participate in this election entirely.'
    },
    verify: {
      nothing:  'You may arrive at the polling booth and find your name is deleted or missing.',
      wrong:    'An outdated address can send you to the wrong constituency or booth.',
      impact:   'Without verification, you risk being denied the right to vote.'
    },
    polling: {
      nothing:  'You may go to the wrong booth and be turned away.',
      wrong:    'Arriving after polling hours means you cannot cast a vote.',
      impact:   'You may lose your vote due to a location or timing error.'
    },
    id: {
      nothing:  'Without an EPIC or approved ID, you will be turned away at the booth.',
      wrong:    'Bringing an unacceptable ID will result in rejection by the polling officer.',
      impact:   'Without valid ID verification, you cannot cast your vote.'
    },
    mail: {
      nothing:  'You will not receive a postal ballot and must vote in person if possible.',
      wrong:    'Missing the Form 12D deadline means your request is rejected.',
      impact:   'You may lose the opportunity to vote if you cannot physically visit the booth.'
    },
    early: {
      nothing:  'You must vote on the designated Polling Day for your constituency.',
      wrong:    'Assuming you can vote on any day will result in missing your voting window.',
      impact:   'Missing Polling Day means you miss your chance to vote.'
    },
    provisional: {
      nothing:  'If someone votes in your name and you do not ask for a tendered ballot, your vote is lost.',
      wrong:    'Leaving the booth without speaking to the Presiding Officer means accepting the fraudulent vote.',
      impact:   'You must explicitly request a Tendered Ballot to record your vote in such cases.'
    },
    eligibility: {
      nothing:  'You may attempt to enroll while ineligible, which will be rejected.',
      wrong:    'Assuming you are eligible without checking can lead to a rejected Form 6.',
      impact:   'Enrolling without eligibility is against ECI rules. Always verify first.'
    }
  };

  // ─── RISK LEVEL MAP ───
  // Three tiers: low / medium / high — plus a one-line reason shown to the user.
  const RISK_LEVEL = {
    eligibility: {
      level: 'low',
      reason: 'Checking eligibility itself carries no consequence — it is informational only.'
    },
    verify: {
      level: 'medium',
      reason: 'An unverified enrollment may cause delays or denial at the booth.'
    },
    register: {
      level: 'high',
      reason: 'Missing the enrollment deadline means you cannot vote in this election.'
    },
    polling: {
      level: 'medium',
      reason: 'Going to the wrong booth or arriving late can prevent you from voting.'
    },
    id: {
      level: 'medium',
      reason: 'Missing or wrong ID (like EPIC or Aadhaar) will stop you at the door.'
    },
    mail: {
      level: 'high',
      reason: 'An unsigned or late postal ballot will not be counted — your vote is lost.'
    },
    early: {
      level: 'low',
      reason: 'Missing early voting is inconvenient but you can still vote on Polling Day.'
    },
    provisional: {
      level: 'high',
      reason: 'Leaving without requesting a tendered ballot when your name is missing or vote was cast by someone else means your vote is gone immediately.'
    }
  };

  // Helper: get risk metadata for a key
  function getRiskLevel(key) {
    return RISK_LEVEL[key] || null;
  }

  // ─── ACTION PLAN BANK ───
  // Minimum ordered steps to resolve the identified risk.
  // No extra info. No repetition. Correct order only.
  const ACTION_PLAN = {
    register: [
      'Submit Form 6 for registration',
      'Verify name in electoral roll',
      'Locate assigned polling booth',
      'Bring approved ID to booth',
      'Cast vote using EVM'
    ],
    verify: [
      'Verify name in electoral roll',
      'Locate assigned polling booth',
      'Bring approved ID to booth',
      'Cast vote using EVM'
    ],
    polling: [
      'Locate assigned polling booth',
      'Go to the booth on Polling Day',
      'Bring approved ID to booth',
      'Cast vote using EVM'
    ],
    id: [
      'Bring approved ID to booth',
      'Show ID to Polling Officer',
      'Cast vote using EVM'
    ],
    mail: [
      'Verify eligibility for postal ballot',
      'Submit Form 12D for postal ballot',
      'Receive postal ballot from Returning Officer',
      'Submit marked postal ballot'
    ],
    early: [
      'Verify exact Polling Day for your constituency',
      'Locate assigned polling booth',
      'Cast vote using EVM on designated day'
    ],
    provisional: [
      'Report to Presiding Officer immediately',
      'Provide your approved ID proof',
      'Request a Tendered Ballot',
      'Fill and submit the Tendered Ballot'
    ],
    eligibility: [
      'Verify eligibility (18+ Indian citizen)',
      'Submit Form 6 for registration',
      'Verify name in electoral roll',
      'Locate assigned polling booth',
      'Cast vote using EVM'
    ]
  };

  // ─── INIT ───
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initWizard();
    renderGuide(null);      // render full guide by default
    renderSimpleTimeline();
    initScenario();
    initEligibility();
    initChat();
    initNav();
    initLocator();
    initScrollAnimations();
  }

  // ─── PROFILE WIZARD ───
  const WIZARD_QUESTIONS = [
    {
      label: 'Question 1 of 4',
      q: 'Are you already registered to vote?',
      sub: 'This determines whether we include registration steps in your plan.',
      key: 'registered',
      options: [
        { icon: '✅', label: 'Yes, I am registered', value: 'yes' },
        { icon: '❌', label: 'No, I need to register', value: 'no' },
        { icon: '❓', label: 'I am not sure', value: 'unsure' }
      ]
    },
    {
      label: 'Question 2 of 4',
      q: 'Do you have a valid government-issued ID (EPIC, Aadhaar, PAN)?',
      sub: 'ID requirements are set by the ECI. This helps us include the right preparation steps.',
      key: 'hasId',
      options: [
        { icon: '🪪', label: 'Yes, I have a valid ID', value: 'yes' },
        { icon: '⚠️', label: 'No or I am not sure', value: 'no' }
      ]
    },
    {
      label: 'Question 3 of 4',
      q: 'How do you plan to cast your vote?',
      sub: 'We will include only the steps relevant to your chosen voting method.',
      key: 'voteMethod',
      options: [
        { icon: '🏛️', label: 'In person on Polling Day', value: 'inperson' },
        { icon: '📬', label: 'By postal ballot (if eligible)', value: 'mail' },
        { icon: '🗓️', label: 'Early voting (if eligible)', value: 'early' }
      ]
    },
    {
      label: 'Question 4 of 4',
      q: 'Have you confirmed your polling booth location?',
      sub: 'Knowing where to go is a required step before Polling Day.',
      key: 'pollingConfirmed',
      options: [
        { icon: '📍', label: 'Yes, I know where to go', value: 'yes' },
        { icon: '🔍', label: 'No, I still need to find it', value: 'no' }
      ]
    }
  ];

  let wizardIdx = 0;
  let wizardProfile = {};

  function initWizard() {
    wizardIdx = 0;
    wizardProfile = {};
    renderWizardQuestion();
  }

  function renderWizardQuestion() {
    const body = document.getElementById('wizard-body');
    if (!body) return;

    // Update dots
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById('wdot-' + i);
      if (!dot) continue;
      dot.classList.remove('active', 'done');
      if (i < wizardIdx) dot.classList.add('done');
      else if (i === wizardIdx) dot.classList.add('active');
    }

    if (wizardIdx >= WIZARD_QUESTIONS.length) {
      applyProfile(wizardProfile);
      body.innerHTML = `
        <div class="wizard-done">
          <div class="wizard-done-icon">🎯</div>
          <h3>Your personalized plan is ready!</h3>
          <p>We filtered the guide to show only the steps that apply to you.</p>
          <a href="#guide" class="wizard-done-cta">View My Plan →</a>
        </div>`;
      return;
    }

    const q = WIZARD_QUESTIONS[wizardIdx];
    body.innerHTML = `
      <div class="wizard-q">
        <div class="wizard-q-label">${q.label}</div>
        <div class="wizard-q-text">${q.q}</div>
        <div class="wizard-q-sub">${q.sub}</div>
        <div class="wizard-options">
          ${q.options.map(o => `
            <button class="wizard-option" data-key="${q.key}" data-val="${o.value}">
              <span class="wizard-option-icon">${o.icon}</span>
              ${o.label}
            </button>`).join('')}
        </div>
      </div>`;

    body.querySelectorAll('.wizard-option').forEach(btn => {
      btn.addEventListener('click', () => {
        wizardProfile[btn.dataset.key] = btn.dataset.val;
        wizardIdx++;
        renderWizardQuestion();
      });
    });
  }

  window.__resetProfile = function () {
    wizardIdx = 0;
    wizardProfile = {};
    renderWizardQuestion();
    renderGuide(null);
    const banner = document.getElementById('guide-plan-banner');
    const resetRow = document.getElementById('guide-reset-row');
    const tag = document.getElementById('guide-tag');
    const desc = document.getElementById('guide-desc');
    if (banner) banner.style.display = 'none';
    if (resetRow) resetRow.style.display = 'none';
    if (tag) tag.textContent = 'Step-by-Step';
    if (desc) desc.textContent = 'Complete the profile above to see your personalized steps, or browse all steps below.';
    window.scrollTo({ top: document.getElementById('profile').offsetTop - 80, behavior: 'smooth' });
  };

  // ─── PROFILE → STEP FILTER ───
  function applyProfile(p) {
    // Decide which GUIDE_STEPS indices to include based on profile
    // GUIDE_STEPS order: 0=Eligibility, 1=Registration, 2=Verification, 3=PollingPlace, 4=VotingProcess, 5=Results
    const include = [];
    const tags = [];

    // Step 0 — Eligibility: always include
    include.push(0);

    // Step 1 — Registration: only if not registered or unsure
    if (p.registered === 'no' || p.registered === 'unsure') {
      include.push(1);
      tags.push('Needs Registration');
    }

    // Step 2 — Verification: include if already registered or unsure
    if (p.registered === 'yes' || p.registered === 'unsure') {
      include.push(2);
      tags.push('Verify Registration');
    }

    // Track tags for Voting Method / ID
    if (p.voteMethod === 'mail') tags.push('Voting by Mail');
    else if (p.voteMethod === 'early') tags.push('Early Voting');
    else tags.push('In-Person Voting');

    if (p.hasId === 'no') tags.push('Needs ID');

    // Step 3 — Polling Place: include if not confirmed, or if in-person/early
    if (p.pollingConfirmed === 'no' || p.voteMethod !== 'mail') {
      include.push(3);
    }

    // Step 4 — Voting Process: always include (core action)
    include.push(4);

    // Step 5 — Results: always include
    include.push(5);

    // Build actionable overrides per profile
    const overrides = buildActionableSteps(p);

    // Validate filtered step set before render (silent — never shown to user)
    const validated = validateGuideSteps(include, overrides, p);
    renderGuide(validated.indices, validated.overrides, tags, p);
  }

  // Returns actionable step text customized to profile answers
  function buildActionableSteps(p) {
    const o = {};

    // Registration — only shown when needed
    o[1] = {
      title: 'Submit Voter Registration',
      body: 'Visit the NVSP / ECI portal or Voter Helpline App, and submit your Form 6 before the official deadline.',
    };

    // Polling Place (index 3)
    if (p.voteMethod === 'mail') {
      o[3] = {
        title: 'Find Your Returning Officer Location',
        body: 'Use the NVSP / ECI portal to locate where to submit your Form 12D for postal voting. Confirm hours before returning your application.',
      };
    } else if (p.voteMethod === 'early') {
      o[3] = {
        title: 'Find Your Polling Booth',
        body: 'Visit the NVSP / ECI portal to find your assigned polling booth. Early voting is generally not available unless eligible for postal ballot.',
      };
    }

    // Voting Process (index 4)
    if (p.voteMethod === 'mail') {
      o[4] = {
        title: 'Voting Process: Postal Ballot',
        body: 'Fill out your postal ballot following all printed instructions. Sign the declaration, then return it by post or at an official drop-off location before the ECI deadline.',
        details: [
          'Follow all instructions on the postal ballot exactly as printed.',
          'Sign the declaration — unsigned ballots are rejected.',
          'Return by post or official drop-off before the ECI deadline.',
          p.hasId === 'no' ? '⚠️ Check if you need identity verification with your postal ballot.' : 'Track your postal ballot status on the NVSP / ECI portal.'
        ]
      };
    } else if (p.voteMethod === 'early') {
      o[4] = {
        title: 'Voting Process: Polling Day',
        body: 'Bring your required ID to your assigned polling booth. Follow all polling officer instructions to press the EVM button on Polling Day.',
        details: [
          p.hasId === 'no' ? '⚠️ URGENT: Check ECI ID rules and obtain a valid EPIC or alternative ID before voting.' : 'Bring your required ID (EPIC, Aadhaar, PAN, etc.).',
          'Follow polling officer instructions at the booth.',
          'Press the EVM button clearly and check the VVPAT slip.',
          'If there is an EVM error, alert the Presiding Officer immediately.'
        ]
      };
    } else {
      // In-person specific overrides based on ID
      if (p.hasId === 'no') {
        o[4] = {
          title: 'Voting Process: In-Person (Action Required)',
          body: 'Check the ECI\'s official ID requirements immediately. If required, obtain an accepted form of ID (like Aadhaar or PAN) well before Polling Day to bring to your polling booth.',
          details: [
            '⚠️ URGENT: Verify ECI\'s exact ID requirements on the official site.',
            'You can download an e-EPIC if you lack a physical card.',
            'Press the EVM button clearly and check the VVPAT slip.',
            'You have the right to vote if you are in line when polls close.'
          ]
        };
      }
    }

    return o;
  }

  // ─── GUIDE RENDERER ───
  function renderGuide(includeIndices, overrides, tags, profile) {
    const grid = document.getElementById('guide-grid');
    const banner = document.getElementById('guide-plan-banner');
    const resetRow = document.getElementById('guide-reset-row');
    const guideTag = document.getElementById('guide-tag');
    const guideDesc = document.getElementById('guide-desc');
    if (!grid) return;

    const stepsToRender = includeIndices
      ? GUIDE_STEPS.filter((_, i) => includeIndices.includes(i))
      : GUIDE_STEPS;

    const ov = overrides || {};

    let stepNum = 1;
    grid.innerHTML = stepsToRender.map((step, idx) => {
      const origIdx = includeIndices ? includeIndices[idx] : idx;
      const isResult = origIdx === GUIDE_STEPS.length - 1;
      const title = (ov[origIdx] && ov[origIdx].title) || step.title;
      const body  = (ov[origIdx] && ov[origIdx].body)  || step.body;
      const dets  = (ov[origIdx] && ov[origIdx].details) || step.details;
      const num   = stepNum++;
      return `
      <div class="guide-step${isResult ? ' step-result-awareness' : ''}" role="listitem" id="guide-step-${origIdx}">
        <div class="step-header">
          <div class="step-number">${num}</div>
          <div class="step-title">${title}</div>
        </div>
        <div class="step-body">${body}</div>
        <div class="step-details" id="step-details-${origIdx}">
          <ul>${dets.map(d => `<li>${d}</li>`).join('')}</ul>
        </div>
        <button class="step-toggle" id="step-toggle-${origIdx}" aria-expanded="false" aria-controls="step-details-${origIdx}" onclick="window.__toggleStep(${origIdx})">
          Show Details ↓
        </button>
      </div>`;
    }).join('');

    // Update guide header & banner
    if (includeIndices && tags) {
      if (guideTag) guideTag.textContent = 'Your Plan';
      if (guideDesc) guideDesc.textContent = `Showing ${stepsToRender.length} step${stepsToRender.length !== 1 ? 's' : ''} based on your profile — irrelevant steps removed.`;
      if (banner) {
        banner.style.display = 'flex';
        banner.innerHTML = `
          <div class="guide-plan-banner-icon">🎯</div>
          <div class="guide-plan-banner-body">
            <div class="guide-plan-banner-title">Personalized for you</div>
            <div class="guide-plan-tags">
              ${tags.map(t => `<span class="guide-plan-tag">${t}</span>`).join('')}
              <span class="guide-plan-tag">${stepsToRender.length} steps</span>
            </div>
          </div>`;
      }
      if (resetRow) resetRow.style.display = 'block';
    }
  }

  window.__toggleStep = function (i) {
    const det = document.getElementById(`step-details-${i}`);
    const btn = document.getElementById(`step-toggle-${i}`);
    if (!det || !btn) return;
    const isOpen = det.classList.contains('open');
    det.classList.toggle('open');
    btn.textContent = isOpen ? 'Show Details ↓' : 'Hide Details ↑';
    btn.setAttribute('aria-expanded', !isOpen);
  };

  // ─── ELIGIBILITY ───
  let eligIdx = 0;
  let eligAnswers = [];

  function initEligibility() {
    eligIdx = 0;
    eligAnswers = [];
    renderEligQuestion();
  }

  function renderEligQuestion() {
    const area = document.getElementById('elig-question-area');
    const result = document.getElementById('elig-result');
    const bar = document.getElementById('elig-progress-bar');
    const prog = document.getElementById('elig-progress');
    if (!area || !result || !bar || !prog) return;

    result.style.display = 'none';
    area.style.display = 'block';

    const pct = (eligIdx / ELIGIBILITY_QUESTIONS.length) * 100;
    bar.style.width = pct + '%';
    prog.setAttribute('aria-valuenow', Math.round(pct));

    if (eligIdx >= ELIGIBILITY_QUESTIONS.length) {
      showEligResult();
      return;
    }

    const q = ELIGIBILITY_QUESTIONS[eligIdx];
    area.innerHTML = `
      <div class="elig-question">
        <h3>${q.q}</h3>
        <p>${q.sub}</p>
        <div class="elig-options">
          ${q.options.map(opt => `<button class="elig-option" data-answer="${opt}">${opt}</button>`).join('')}
        </div>
      </div>
    `;
    area.querySelectorAll('.elig-option').forEach(btn => {
      btn.addEventListener('click', () => handleEligAnswer(btn.dataset.answer));
    });
  }

  function handleEligAnswer(answer) {
    const q = ELIGIBILITY_QUESTIONS[eligIdx];
    eligAnswers.push({ question: q.q, answer });

    if (q.failOn && answer === q.failOn) {
      showEligResult('fail', q.failMsg);
      return;
    }
    if (q.partialOn && answer === q.partialOn) {
      showEligResult('partial', q.partialMsg);
      return;
    }
    eligIdx++;
    renderEligQuestion();
  }

  function showEligResult(type, msg) {
    const area = document.getElementById('elig-question-area');
    const result = document.getElementById('elig-result');
    const bar = document.getElementById('elig-progress-bar');
    if (!area || !result || !bar) return;

    area.style.display = 'none';
    result.style.display = 'block';
    bar.style.width = '100%';

    if (type === 'fail') {
      result.innerHTML = `
        <div class="elig-result-icon">⚠️</div>
        <h3>You May Not Be Eligible</h3>
        <p>${msg}</p>
        <button class="elig-restart" onclick="window.__restartElig()">Start Over</button>
      `;
    } else if (type === 'partial') {
      result.innerHTML = `
        <div class="elig-result-icon">ℹ️</div>
        <h3>Partial Eligibility</h3>
        <p>${msg}</p>
        <button class="elig-restart" onclick="window.__restartElig()">Start Over</button>
      `;
    } else {
      result.innerHTML = `
        <div class="elig-result-icon">✅</div>
        <h3>You Appear to Be Eligible!</h3>
        <p>Based on your answers, you meet the general requirements to vote. The next step is to enroll (if you haven't already) and prepare for Polling Day. Visit the <strong>ECI Voter Portal</strong> for official registration.</p>
        <button class="elig-restart" onclick="window.__restartElig()">Start Over</button>
      `;
    }
  }

  window.__restartElig = function () {
    eligIdx = 0;
    eligAnswers = [];
    renderEligQuestion();
  };

  // ─── SIMPLE TIMELINE ───
  function renderSimpleTimeline() {
    const container = document.getElementById('timeline-container');
    if (!container) return;
    container.innerHTML = TIMELINE_DATA.map(t => `
      <div class="timeline-item" role="listitem">
        <div class="timeline-item-header">
          <span class="timeline-order">${t.order}</span>
          <span class="timeline-name">${t.name}</span>
        </div>
        <div class="timeline-when">
          <span aria-hidden="true">⏳</span> ${t.when}
        </div>
        <div class="timeline-do">
          ${t.action}
        </div>
      </div>
    `).join('');
  }

  // ─── INTERACTIVE SCENARIO ───
  let currentScenarioIdx = 0;

  function initScenario() {
    currentScenarioIdx = 0;
    renderScenarioStep();
  }

  function renderScenarioStep() {
    const container = document.getElementById('scenario-container');
    if (!container) return;

    if (currentScenarioIdx >= SCENARIOS.length) {
      container.innerHTML = `
        <div class="scenario-card scenario-done">
          <h3>🎉 Scenario Complete!</h3>
          <p>You have successfully navigated through all 6 election process steps.</p>
          <button class="scenario-btn" onclick="window.__restartScenario()">Restart Scenario</button>
        </div>
      `;
      return;
    }

    const s = SCENARIOS[currentScenarioIdx];
    container.innerHTML = `
      <div class="scenario-card">
        <div class="scenario-progress">Step ${currentScenarioIdx + 1} of 6</div>
        <h3 class="scenario-title">${s.title}</h3>
        <p class="scenario-situation">${s.situation}</p>
        <div class="scenario-choices">
          ${s.choices.map((c, i) => `
            <button class="scenario-choice-btn" onclick="window.__handleScenarioChoice(${i})">
              ${c.text}
            </button>
          `).join('')}
        </div>
        <div class="scenario-result" id="scenario-result-${currentScenarioIdx}" style="display:none;"></div>
      </div>
    `;
  }

  window.__handleScenarioChoice = function(choiceIdx) {
    const s = SCENARIOS[currentScenarioIdx];
    const choice = s.choices[choiceIdx];
    const resDiv = document.getElementById(`scenario-result-${currentScenarioIdx}`);
    const btns = document.querySelectorAll('.scenario-choice-btn');
    
    // Disable buttons
    btns.forEach(b => b.disabled = true);

    // Show result
    resDiv.style.display = 'block';
    const isCorrect = choice.correct;
    resDiv.innerHTML = `
      <div class="scenario-result-box ${isCorrect ? 'correct' : 'incorrect'}">
        <strong>${isCorrect ? '✅' : '❌'} Result:</strong> ${choice.result}
      </div>
      <button class="scenario-next-btn" onclick="window.__nextScenario()">
        ${isCorrect ? 'Next Step →' : 'Retry'}
      </button>
    `;

    // Highlight chosen button
    btns[choiceIdx].classList.add(isCorrect ? 'btn-correct' : 'btn-incorrect');
  };

  window.__nextScenario = function() {
    const s = SCENARIOS[currentScenarioIdx];
    const resDiv = document.getElementById(`scenario-result-${currentScenarioIdx}`);
    const isRetry = resDiv.querySelector('.incorrect');
    if (!isRetry) {
      currentScenarioIdx++;
    }
    renderScenarioStep();
  };

  window.__restartScenario = function() {
    initScenario();
  };

  // ─── CHAT ───
  function initChat() {
    addBotMsg('##section## 📋 Situation\nYou need help with the election process.\n\n##section## ✅ Steps\n• Ask about registering, ID, or voting\n• Use the buttons below\n\n##section## 🔄 Sequence\nAsk → Learn → Vote\n\n##section## ⚠️ Notes\nI only provide neutral voting steps.');

    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.dataset.q;
        if (q) askQuestion(q);
      });
    });

    const form = document.getElementById('chat-form');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const q = input.value.trim();
        if (!q) return;
        input.value = '';
        askQuestion(q);
      });
    }
  }

  // ─── SILENT VALIDATION ENGINE ───
  // Runs before every output. Never shown to user.
  // Returns { valid: bool, reason: string }

  // RULE DEFINITIONS
  const REQUIRED_SECTIONS = ['📋 Situation', 'Risk Level', 'What Could Go Wrong', '⚡ What You Should Do'];

  // Key → expected topic keywords for relevance check
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
    default:     /.*/  // always relevant
  };

  /**
   * Extracts context and validates chat response.
   * Extracts Voting Stage and Issue, maintains state, asks ONE question if unclear.
   */
  function validateChatResponse(q, key, text) {
    const lower = q.toLowerCase();

    // EXPLICIT BYPASS: Political Persuasion Guard
    if (key === 'political_guard') {
      return { key, text, isUnverified: false };
    }

    // Extraction: Voting Stage
    if (!window._votingStage) {
      if (/(not register|haven't register|how to register|form 6|new voter)/.test(lower)) {
        window._votingStage = 'Not Registered';
      } else if (/(am register|already register)/.test(lower) && !/(verif|check)/.test(lower)) {
        window._votingStage = 'Registered';
      } else if (/(verified|checked name|found name|on the roll)/.test(lower)) {
        window._votingStage = 'Verified';
      } else if (/(ready to vote|have epic|have voter id|know booth)/.test(lower)) {
        window._votingStage = 'Ready to Vote';
      }
    }

    // Extraction: Issue
    if (!window._issue && /(lost|missing|wrong|error|didn't receive|someone else)/.test(lower)) {
      window._issue = q; // rough extraction of the issue
    }

    // Ask ONE short question if stage is unclear, do not repeat
    if (!window._votingStage && !window._askedForStage) {
      window._askedForStage = true;
      return {
        key: 'missing_stage',
        text: '##section## 📋 Situation\nI need to know your current voting stage to help you best.\n\n##section## ⚡ What You Should Do\n• Are you: Not Registered, Registered, Verified, or Ready to Vote?',
        isUnverified: false
      };
    }

    // Extraction: Intent, Key Issue, Missing Info
    const isStateRequired = ['register', 'polling', 'id', 'early', 'mail'].includes(key);
    const hasState = /alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming/i.test(lower);
    
    if (isStateRequired && !hasState && !window._askedForState) {
      window._askedForState = true;
      return {
        key: 'missing_info',
        text: '##section## 📋 Situation\nI need to know your state to give accurate rules.\n\n##section## ✅ Steps\n• Reply with the name of your state\n\n##section## 🔄 Sequence\nTell me State → Get Accurate Rules\n\n##section## ⚠️ Notes\nEvery state has different voting laws.',
        isUnverified: false
      };
    }
    
    // Reset state tracker on successful fulfillment
    window._askedForState = false;

    // CHECK 1: Logically correct
    if (!text || typeof text !== 'string' || text.trim().length < 30) {
      return safeDefault(q);
    }

    // CHECK 2: Structure
    const hasAllSections = REQUIRED_SECTIONS.every(s => text.includes(s));
    if (!hasAllSections) {
      return safeDefault(q);
    }

    return { key, text, isUnverified: key === 'unverified' };
  }

  function safeDefault(q) {
    return { key: 'default', text: QA_BANK.default || '##section## 📋 Situation\nI am missing data.\n\n##section## 🟡 Risk Level\nMedium\n\n##section## 🟠 What Could Go Wrong\nMistakes.\n\n##section## ⚡ What You Should Do\n• Verify with ECI.', isUnverified: false };
  }

  /**
   * Validates a filtered guide step set before render.
   * @param {number[]} indices   - step indices to render
   * @param {object}   overrides - per-index text overrides
   * @param {object}   profile   - user profile answers
   * @returns {{ indices: number[], overrides: object }} — safe, validated set
   */
  function validateGuideSteps(indices, overrides, profile) {
    let safe = Array.isArray(indices) ? [...indices] : [];
    const ov = overrides && typeof overrides === 'object' ? { ...overrides } : {};

    // CHECK 1: Logical correctness — indices must be valid GUIDE_STEPS positions
    safe = safe.filter(i => typeof i === 'number' && i >= 0 && i < GUIDE_STEPS.length);

    // CHECK 2: No missing steps — Voting Process (4) and Results (5) must always be present
    if (!safe.includes(4)) safe.push(4);
    if (!safe.includes(5)) safe.push(5);
    safe.sort((a, b) => a - b);

    // CHECK 3: Relevance — overrides must have non-empty title and body strings
    Object.keys(ov).forEach(k => {
      const entry = ov[k];
      if (!entry || typeof entry !== 'object') { delete ov[k]; return; }
      if (entry.title !== undefined && (typeof entry.title !== 'string' || entry.title.trim().length < 3)) {
        delete ov[k]; return;
      }
      if (entry.body !== undefined && (typeof entry.body !== 'string' || entry.body.trim().length < 10)) {
        delete ov[k]; return;
      }
    });

    return { indices: safe, overrides: ov };
  }

  // ─── SILENT QUALITY GATE ───
  // Runs before every render. Three checks, silent fixes. Never surfaced to user.
  //
  //  CHECK A — Logical prediction: key must have both RISK_BANK + RISK_LEVEL entries.
  //            If either missing → suppress risk and action cards.
  //
  //  CHECK B — Steps completeness: ACTION_PLAN[key] must have ≥ 2 entries.
  //            If not → suppress action card only.
  //
  //  CHECK C — Response usefulness: text must contain all 4 sections AND ≥ 80 chars.
  //            If not → substitute QA_BANK.default and suppress cards.
  //
  function runQualityGate(q, key, rawText) {
    let resolvedKey  = key;
    let resolvedText = rawText;
    let showRisk     = true;
    let showAction   = true;

    // EXPLICIT BYPASS for guards
    const guardKeys = ['missing_stage', 'missing_info', 'political_guard', 'location_guard', 'non_india'];
    if (guardKeys.includes(resolvedKey)) {
      return { key: resolvedKey, text: resolvedText, showRisk: false, showAction: false, isUnverified: false };
    }

    // CHECK A: Logical prediction
    if (!RISK_BANK[resolvedKey] || !RISK_LEVEL[resolvedKey]) {
      showRisk   = false;
      showAction = false;
    }

    // CHECK B: Steps completeness
    const steps = ACTION_PLAN[resolvedKey];
    if (!steps || steps.length < 2) {
      showAction = false;
    }

    // CHECK C: Response usefulness
    const hasStructure = REQUIRED_SECTIONS.every(s => resolvedText.includes(s));
    const hasLength    = typeof resolvedText === 'string' && resolvedText.trim().length >= 80;
    if (!hasStructure || !hasLength) {
      resolvedText = QA_BANK.default;
      showRisk     = false;
      showAction   = false;
    }

    return { key: resolvedKey, text: resolvedText,
             showRisk, showAction, isUnverified: resolvedKey === 'unverified' };
  }

  // ─── CHAT DISPATCH ───
  function askQuestion(q) {
    addUserMsg(q);
    const sug = document.getElementById('chat-suggestions');
    if (sug) sug.style.display = 'none';

    setTimeout(() => {
      const key       = matchKey(q);
      const rawText   = QA_BANK[key] || QA_BANK.default;
      const validated = validateChatResponse(q, key, rawText);
      const final     = runQualityGate(q, validated.key, validated.text);

      addBotMsg(final.text, final.isUnverified);

      if (final.showRisk) {
        const risk = RISK_BANK[final.key];
        if (risk) setTimeout(() => addRiskCard(risk, final.key), 600);
      }
    }, 500 + Math.random() * 400);
  }

  // Returns the QA_BANK key (not the value) so caller knows if unverified
  function matchKey(q) {
    const lower = q.toLowerCase();
    
    // Explicit Foreign Guard: Reject US/foreign terms
    if (/united states|america|us|president|senator|congressman|democrat|republican|federal|state legislature/.test(lower)) {
      return 'non_india';
    }

    // Explicit Location Guard: If asking for location-specific info but unclear
    if (/(in my state|in my city|local|my district)/.test(lower) && !/delhi|mumbai|maharashtra|karnataka|up|punjab|bengal|kerala|tamil nadu|gujarat|rajasthan|bihar|mp|ap|telangana|odisha/.test(lower)) {
      return 'location_guard';
    }

    // Explicit Political Guard: Reject persuasion/endorsement requests
    if (lower.includes('who should i vote for') || 
        lower.includes('who to vote for') ||
        lower.includes('endorse') || 
        lower.includes('candidate recommendation') ||
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

  function matchAnswer(q) { return QA_BANK[matchKey(q)] || QA_BANK.default; }

  /**
   * Renders a realistic risk prediction card in the chat.
   * Only called when a RISK_BANK entry exists for the matched key.
   */
  function addRiskCard(risk, key) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const meta   = getRiskLevel(key);
    const level  = meta ? meta.level : null;
    const reason = meta ? meta.reason : '';

    const LEVEL_CONFIG = {
      low:    { label: 'Low Risk',    emoji: '🟢', cls: 'risk-badge-low' },
      medium: { label: 'Medium Risk', emoji: '🟡', cls: 'risk-badge-medium' },
      high:   { label: 'High Risk',   emoji: '🔴', cls: 'risk-badge-high' }
    };
    const cfg = level ? LEVEL_CONFIG[level] : null;

    const card = document.createElement('div');
    card.className = `chat-msg bot risk-card${level ? ' risk-card-' + level : ''}`;
    card.innerHTML = `
      <div class="msg-section-header"><strong>Predict:</strong></div>
      <div class="msg-bullet"><strong>What happens if user takes no action:</strong> ${risk.nothing}</div>
      <div class="msg-bullet"><strong>What could go wrong:</strong> ${risk.wrong}</div>
      <div class="msg-bullet"><strong>Impact on their ability to vote:</strong> ${risk.impact}</div>
    `;
    container.appendChild(card);
    container.scrollTop = container.scrollHeight;

    // Schedule action plan card immediately after risk card
    const steps = ACTION_PLAN[key];
    if (steps) setTimeout(() => addActionCard(steps, key), 400);
  }

  /**
   * Renders an ordered action plan to resolve the identified risk.
   * Steps are minimal, correctly ordered, and focused on the specific key.
   */
  function addActionCard(steps, key) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const meta  = getRiskLevel(key);
    const level = meta ? meta.level : 'medium';
    const BORDER = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };

    const card = document.createElement('div');
    card.className = 'chat-msg bot action-card';
    card.style.borderLeftColor = BORDER[level] || '#2563EB';
    const items = steps.map((s, i) =>
      `<div class="action-step"><span class="action-num">${i + 1}</span><span>${s}</span></div>`
    ).join('');
    card.innerHTML = `
      <div class="msg-label action-label">⚡ Fix It — What To Do Now</div>
      ${items}
    `;
    container.appendChild(card);
    container.scrollTop = container.scrollHeight;
  }

  function addBotMsg(text, isUnverified) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    // ── SYSTEM DIRECTIVE ENFORCEMENT ──
    // Every outgoing bot response is scanned for foreign electoral terms.
    // If any are detected, the response is replaced with the ECI fallback.
    const safeText = enforceDirective(text);
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    let inner = `<div class="msg-label">CivicNavigator</div><div>${formatMsg(safeText)}</div>`;
    
    // UI extension for state tracking
    if (window._votingStage || window._issue) {
       inner += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.85em; color: #9ca3af;">
         <strong>Extraction:</strong><br>
         - Voting Stage: ${window._votingStage || 'Unclear'}<br>
         ${window._issue ? `- Issue: ${escapeHtml(window._issue)}` : '- Issue: None'}
       </div>`;
    }

    if (isUnverified) {
      inner += `<div class="msg-unverified">⚠️ Please verify with official ECI sources at eci.gov.in</div>`;
    }
    div.innerHTML = inner;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function addUserMsg(text) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'chat-msg user';
    div.innerHTML = `<div class="msg-label">You</div><div>${escapeHtml(text)}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function formatMsg(text) {
    let html = escapeHtml(text);
    // Convert ##section## markers into styled section headers
    html = html.replace(/##section##\s*(.+?)(?=\n|$)/g, function(_, title) {
      return '<div class="msg-section-header">' + title.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') + '</div>';
    });
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Bullet points: lines starting with •
    html = html.replace(/^• (.+)$/gm, '<div class="msg-bullet">$1</div>');
    // Line breaks
    html = html.replace(/\n/g, '');
    return html;
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ─── NAV ───
  function initNav() {
    const toggle = document.getElementById('nav-mobile-toggle');
    const links = document.querySelector('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const isOpen = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen);
      });
      links.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          links.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  // ─── SCROLL ANIMATIONS ───
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.guide-step, .timeline-item, .eligibility-card, .locator-container').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  // ─── POLLING LOCATOR ───
  function initLocator() {
    const btn = document.getElementById('find-poll-btn');
    const zipInput = document.getElementById('zip-input');
    const mapContainer = document.getElementById('map-container');
    const pollMap = document.getElementById('poll-map');

    if (btn && zipInput && mapContainer && pollMap) {
      btn.addEventListener('click', () => {
        const zip = zipInput.value.trim();
        if (zip.length >= 5) {
          pollMap.src = `https://maps.google.com/maps?q=polling+locations+near+${zip}&output=embed`;
          mapContainer.style.display = 'block';
        } else {
          alert('Please enter a valid zip code.');
        }
      });
      zipInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btn.click();
      });
    }
  }
})();
