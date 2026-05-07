import re

with open('/Users/aryadevchatterjee/Documents/aria/aria-frontend/src/pages/dashboard/Studio.jsx', 'r') as f:
    lines = f.readlines()

# We want to keep lines 0 to 213 (0-indexed)
# The duplicate block starts at line 214 (1-indexed 215) and goes until 423 (1-indexed 424)
# So we drop lines 214 to 423

new_lines = lines[:214]

# Then we take lines from 424 to the end
# and we should un-indent them by 2 spaces since they were nested inside the duplicate

for line in lines[424:]:
    if line.startswith('  '):
        new_lines.append(line[2:])
    else:
        new_lines.append(line)

with open('/Users/aryadevchatterjee/Documents/aria/aria-frontend/src/pages/dashboard/Studio.jsx', 'w') as f:
    f.writelines(new_lines)
