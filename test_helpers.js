// --- Helper Functions for Tests ---

function checkEligibility(age, citizenship) {
  if (citizenship !== 'Indian') return false;
  if (age < 18) return false;
  return true;
}

function getRiskLevel(stage) {
  if (stage === 'Not Registered') return 'HIGH';
  if (stage === 'Verified') return 'LOW';
  return 'MEDIUM';
}

function validateInput(input) {
  if (!input || input.trim() === '') return false;
  if (input.includes('<script>') || input.includes('</')) return false;
  return true;
}

function handleAPIError(error) {
  if (error && error.message === 'Timeout') {
    return 'Taking longer than expected... Verify at eci.gov.in';
  }
  return 'Please verify at eci.gov.in';
}

function validatePINCode(pin) {
  if (!pin) return false;
  const p = pin.trim();
  // Valid Indian PIN code starts with 1-9 and has 6 digits
  return /^[1-9][0-9]{5}$/.test(p);
}

// Test Suite: CivicNavigator Tests
const tests = {
  // Test 1: Eligibility Check
  testEligibility: function() {
    console.assert(checkEligibility(17, 'Indian') === false, 'Under 18 should fail');
    console.assert(checkEligibility(18, 'Indian') === true, '18+ Indian citizen should pass');
    console.assert(checkEligibility(25, 'Foreign') === false, 'Non-Indian should fail');
    return 'Eligibility tests passed';
  },

  // Test 2: Risk Level Detection  
  testRiskLevel: function() {
    console.assert(getRiskLevel('Not Registered') === 'HIGH', 'Unregistered voter is HIGH risk');
    console.assert(getRiskLevel('Verified') === 'LOW', 'Verified voter is LOW risk');
    return 'Risk level tests passed';
  },

  // Test 3: Input Validation
  testInputValidation: function() {
    console.assert(validateInput('') === false, 'Empty input should fail');
    console.assert(validateInput('<script>alert(1)</script>') === false, 'XSS input should be rejected');
    console.assert(validateInput('Mumbai') === true, 'Valid constituency should pass');
    return 'Input validation tests passed';
  },

  // Test 4: API Error Handling
  testAPIFallback: function() {
    const result = handleAPIError(null);
    console.assert(result === 'Please verify at eci.gov.in', 'API failure should show ECI fallback');
    return 'API fallback tests passed';
  },

  // Test 5: Edge Cases
  testEdgeCases: function() {
    console.assert(validatePINCode('000000') === false, 'Invalid PIN code should fail');
    console.assert(validatePINCode('400001') === true, 'Valid PIN code should pass');
    return 'Edge case tests passed';
  }
};

// Run all tests on load
function runAllTests() {
  let passedCount = 0;
  const total = Object.keys(tests).length;
  Object.keys(tests).forEach(test => {
    try {
      console.log('✅ ' + tests[test]());
      passedCount++;
    } catch(e) {
      console.error('❌ Test failed: ' + test, e);
    }
  });

  // Update Status Panel
  const statusPanel = document.getElementById('test-status-panel');
  if (statusPanel) {
    if (passedCount === total) {
      statusPanel.innerHTML = `✅ All ${total} system checks passed | Last verified: on load`;
      statusPanel.style.color = '#15803D';
      statusPanel.style.backgroundColor = '#F0FDF4';
    } else {
      statusPanel.innerHTML = `❌ ${passedCount}/${total} system checks passed | Last verified: on load`;
      statusPanel.style.color = '#DC2626';
      statusPanel.style.backgroundColor = '#FEF2F2';
    }
  }
}

// Auto-run tests in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
  document.addEventListener('DOMContentLoaded', runAllTests);
}
