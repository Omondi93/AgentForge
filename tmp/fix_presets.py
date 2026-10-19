import re

with open('src/data/presets.ts', 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # lines 354 to 360 in 1-based indexing
    idx = i + 1
    if idx == 354:
        new_lines.append("}`,\n")
    elif idx == 355:
        new_lines.append("          },\n")
    elif idx == 356:
        new_lines.append("          {\n")
    elif idx == 357:
        new_lines.append("            path: 'src/server/auth.ts',\n")
    elif idx == 358:
        new_lines.append("            additions: 68,\n")
    elif idx == 359:
        new_lines.append("            deletions: 4,\n")
    elif idx == 360:
        new_lines.append("            patch: `@@ -1,8 +1,72 @@\n")
    elif idx == 407:
        new_lines.append("+});`,\n")
    else:
        new_lines.append(line)

with open('src/data/presets.ts', 'w') as f:
    f.writelines(new_lines)

print("Updated presets.ts successfully")
