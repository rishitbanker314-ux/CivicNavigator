import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract Risk Assessment section
risk_pattern = r'(    <!-- Voting Risk Assessment -->\n    <section id="risk-assessment" class="section ra-section" aria-labelledby="ra-title">.*?    </section>\n)'
risk_match = re.search(risk_pattern, content, flags=re.DOTALL)
if not risk_match:
    print("Risk Assessment not found")
    exit(1)
risk_section = risk_match.group(1)

# Extract Action Plan section
action_pattern = r'(    <!-- Action Plan -->\n    <section id="action-plan" class="section ap-section" aria-labelledby="ap-title">.*?    </section>\n)'
action_match = re.search(action_pattern, content, flags=re.DOTALL)
if not action_match:
    print("Action Plan not found")
    exit(1)
action_section = action_match.group(1)

# We want to replace the whole block where both are
# Actually, they are adjacent. Risk comes first, then Action Plan.
combined_pattern = risk_pattern + r'\n' + action_pattern
if not re.search(combined_pattern, content, flags=re.DOTALL):
    print("Adjacent combined block not found")
    exit(1)

# Update Risk Section text
new_risk_section = risk_section
new_risk_section = new_risk_section.replace('<h2 id="ra-title" class="ra-heading">Your Voting Risk Assessment</h2>', '<h2 id="ra-title" class="ra-heading">Your Voting Risk</h2>')
new_risk_section = new_risk_section.replace('<div class="ra-card-value" id="ra-stage-value">Unknown</div>', '<div class="ra-card-value" id="ra-stage-value" style="color: #2563EB;">Not Registered</div>')
new_risk_section = new_risk_section.replace('<div class="ra-card-note" id="ra-stage-note">Select your stage above</div>', '<div class="ra-card-note" id="ra-stage-note">You need to register to vote</div>')

new_risk_section = new_risk_section.replace('<div class="ra-risk-pill" id="ra-risk-pill" style="background: #E5E7EB; color: #4B5563;">PENDING</div>', '<div class="ra-risk-pill ra-pill-high" id="ra-risk-pill" style="background: #FEE2E2; color: #DC2626;">HIGH</div>')
new_risk_section = new_risk_section.replace('<div class="ra-card-note" id="ra-risk-note">Awaiting profile completion</div>', '<div class="ra-card-note ra-note-red" id="ra-risk-note">Your vote may be at risk</div>')

new_risk_section = new_risk_section.replace('<div class="ra-card-value ra-value-issue" id="ra-issue-value" style="color: #6B7280;">N/A</div>', '<div class="ra-card-value ra-value-issue" id="ra-issue-value">Registration Incomplete</div>')
new_risk_section = new_risk_section.replace('<div class="ra-card-note" id="ra-issue-note">Awaiting profile completion</div>', '<div class="ra-card-note ra-note-amber" id="ra-issue-note">Act now to protect your vote</div>')

new_risk_section = new_risk_section.replace('You will not be able to cast your vote on election day. Your name will not appear on the electoral roll and booth officials cannot help you.', 'You will not be able to cast your vote. Your name will not appear on the electoral roll and booth officials cannot assist you on election day.')

# Replace in content: Risk + Action -> Action + Risk
new_content = content.replace(risk_match.group(1), '')
new_content = new_content.replace(action_match.group(1), action_section + '\n' + new_risk_section)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated index.html")
