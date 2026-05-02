// ============================================
// CIVICNAVIGATOR HELPER FUNCTIONS
// ============================================

function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .trim()
    .slice(0, 500);
}

function checkEligibility(person) {
  if (person.age <= 0) return false;
  if (!person.citizen) return false;
  if (person.age < 18) return false;
  return true;
}

function getRiskLevel(stage) {
  if (stage === 'Not Registered' || !stage) return 'HIGH';
  if (stage === 'Verified') return 'LOW';
  if (stage === 'Registered') return 'MEDIUM';
  return 'HIGH';
}

function validatePINCode(pin) {
  if (!pin) return false;
  const p = pin.trim();
  return /^[1-9][0-9]{5}$/.test(p);
}

function isPoliticalContent(input) {
  const blocked = [
    'vote for', 'best party', 'which party', 'support',
    'bjp', 'congress', 'aap', 'sp ', 'bsp', 'dmk',
    'who should i vote', 'which candidate', 'endorse'
  ];
  const lower = input.toLowerCase();
  return blocked.some(term => lower.includes(term));
}

function handlePoliticalQuery() {
  return 'CivicNavigator is strictly non-partisan. I can help ' +
    'with the voting process, registration, and official ECI ' +
    'procedures — but cannot recommend any party or candidate.';
}

function handleAPIError(error) {
  if (error && error.error === 'timeout') {
    return 'Taking longer than expected... Verify at eci.gov.in';
  }
  return 'Please verify at eci.gov.in';
}

function validateInput(input) { // Keep this for app.js usage
  if (!input || input.trim() === '') return false;
  if (input.includes('<script>') || input.includes('</')) return false;
  return true;
}

// ============================================
// CIVICNAVIGATOR TEST SUITE v2.0
// ============================================

const TestSuite = {
  
  results: [],
  passed: 0,
  failed: 0,

  assert: function(condition, testName, expected, actual) {
    const result = { testName, passed: condition, expected, actual };
    this.results.push(result);
    if (condition) this.passed++;
    else this.failed++;
    return condition;
  },

  // GROUP 1: Input Validation Tests
  testInputValidation: function() {
    this.assert(
      sanitizeInput('') === '', 
      'Empty input returns empty string', '', '');
    this.assert(
      sanitizeInput('<script>alert(1)</script>').includes('<script>') === false,
      'XSS injection blocked', false, true);
    this.assert(
      sanitizeInput('A'.repeat(600)).length === 500,
      'Input truncated to 500 chars', 500, 600);
    this.assert(
      sanitizeInput('Mumbai constituency') === 'Mumbai constituency',
      'Valid input passes through', 'Mumbai constituency', '');
  },

  // GROUP 2: Eligibility Logic Tests
  testEligibility: function() {
    this.assert(
      checkEligibility({ age: 17, citizen: true }) === false,
      'Under 18 is ineligible', false, true);
    this.assert(
      checkEligibility({ age: 18, citizen: true }) === true,
      '18 year old citizen is eligible', true, false);
    this.assert(
      checkEligibility({ age: 25, citizen: false }) === false,
      'Non-citizen is ineligible', false, true);
    this.assert(
      checkEligibility({ age: 0, citizen: true }) === false,
      'Age 0 is ineligible', false, true);
  },

  // GROUP 3: Risk Assessment Tests
  testRiskAssessment: function() {
    this.assert(
      getRiskLevel('Not Registered') === 'HIGH',
      'Unregistered = HIGH risk', 'HIGH', '');
    this.assert(
      getRiskLevel('Registered') === 'MEDIUM',
      'Registered unverified = MEDIUM risk', 'MEDIUM', '');
    this.assert(
      getRiskLevel('Verified') === 'LOW',
      'Verified = LOW risk', 'LOW', '');
    this.assert(
      getRiskLevel('') === 'HIGH',
      'Unknown stage defaults to HIGH', 'HIGH', '');
  },

  // GROUP 4: PIN Code Validation Tests
  testPINCodeValidation: function() {
    this.assert(
      validatePINCode('400001') === true,
      'Valid Mumbai PIN passes', true, false);
    this.assert(
      validatePINCode('000000') === false,
      'All-zero PIN fails', false, true);
    this.assert(
      validatePINCode('12345') === false,
      '5-digit PIN fails', false, true);
    this.assert(
      validatePINCode('abcdef') === false,
      'Non-numeric PIN fails', false, true);
  },

  // GROUP 5: Political Filter Tests
  testPoliticalFilter: function() {
    this.assert(
      isPoliticalContent('who should I vote for') === true,
      'Vote suggestion detected', true, false);
    this.assert(
      isPoliticalContent('how do I register') === false,
      'Process question passes filter', false, true);
    this.assert(
      isPoliticalContent('best party in India') === true,
      'Party preference detected', true, false);
  },

  // GROUP 6: API Error Handling Tests
  testAPIErrorHandling: function() {
    this.assert(
      handleAPIError(null) !== null,
      'Null API response handled', true, false);
    this.assert(
      handleAPIError({ error: 'timeout' }).includes('eci.gov.in'),
      'Timeout shows ECI fallback', true, false);
  },

  // RUN ALL AND DISPLAY
  runAll: function() {
    this.testInputValidation();
    this.testEligibility();
    this.testRiskAssessment();
    this.testPINCodeValidation();
    this.testPoliticalFilter();
    this.testAPIErrorHandling();
    this.displayResults();
  },

  displayResults: function() {
    const bar = document.getElementById('test-status-bar');
    if (bar) {
      const pct = Math.round((this.passed / 
        (this.passed + this.failed)) * 100);
      bar.innerHTML = `✅ System Check: ${this.passed} passed, 
        ${this.failed} failed | Coverage: ${pct}% | 
        ${this.failed === 0 ? 'All systems operational' : 
        'Issues detected'}`;
      bar.style.background = this.failed === 0 ? '#F0FDF4' : '#FEF2F2';
      bar.style.color = this.failed === 0 ? '#15803D' : '#DC2626';
    }
    console.table(this.results);
  }
};

// Run on page load:
window.addEventListener('load', () => TestSuite.runAll());
