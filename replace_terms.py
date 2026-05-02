import os
import re

replacements = [
    (r'(?i)\bZip Code\b', 'PIN Code / Constituency'),
    (r'(?i)50 States Covered', '28 States + 8 UTs'),
    (r'(?i)\bPolling Place\b', 'Polling Booth'),
    (r'(?i)\bBallot\b', 'EVM (Electronic Voting Machine)'),
    (r'(?i)\bPolling Station\b', 'Polling Booth'),
    (r'(?i)\bState\b(?!s)', 'State/UT'),
    (r'(?i)\bStates\b', 'State/UTs'),
    (r'(?i)U\.S\. citizen', 'Indian citizen'),
    (r'(?i)Enter your Zip Code to find voting locations near you', 'Enter your Constituency or PIN Code to find your assigned Polling Booth via Google Maps'),
    (r'(?i)Enter your PIN Code or Constituency name to locate your assigned Polling Booth via the ECI portal\.', 'Enter your Constituency or PIN Code to find your assigned Polling Booth via Google Maps')
]

for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.js') or file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements:
                new_content = re.sub(old, new, new_content)
            
            # Additional targeted fix for index.html google maps text
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
