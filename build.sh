#!/bin/bash
# Build a single index.html with all CSS and JS inlined

CSS=$(cat index.css)
APPJS=$(cat app.js)
TESTJS=$(cat test_helpers.js)
CONFIGJS=$(cat config.js)

# Extract everything before </head> from index.html
# and replace the external CSS/JS references with inline versions

python3 -c "
import re

with open('index.html', 'r') as f:
    html = f.read()

with open('index.css', 'r') as f:
    css = f.read()

with open('config.js', 'r') as f:
    configjs = f.read()

with open('test_helpers.js', 'r') as f:
    testjs = f.read()

with open('app.js', 'r') as f:
    appjs = f.read()

# Replace external CSS link with inline style
html = html.replace('<link rel=\"stylesheet\" href=\"index.css\" />', '<style>\n' + css + '\n</style>')

# Replace external JS with inline scripts
html = html.replace('<script src=\"config.js\"></script>', '<script>\n' + configjs + '\n</script>')
html = html.replace('<script src=\"test_helpers.js\"></script>', '<script>\n' + testjs + '\n</script>')
html = html.replace('<script src=\"app.js\"></script>', '<script>\n' + appjs + '\n</script>')

with open('dist/index.html', 'w') as f:
    f.write(html)

print(f'Built dist/index.html: {len(html)} bytes')
"
