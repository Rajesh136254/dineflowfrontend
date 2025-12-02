import os

path = r"c:\Users\Rajeswara\Downloads\EndOfHunger\dineflowreact\src\pages\AdminPage.js"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1-based line numbers to remove
lines_to_remove = []
lines_to_remove.extend(range(251, 254)) # 251, 252, 253
lines_to_remove.extend(range(350, 353)) # 350, 351, 352
lines_to_remove.extend(range(368, 370)) # 368, 369
lines_to_remove.extend(range(413, 415)) # 413, 414
lines_to_remove.extend(range(428, 430)) # 428, 429
lines_to_remove.extend(range(438, 440)) # 438, 439

new_lines = [line for i, line in enumerate(lines, 1) if i not in lines_to_remove]

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Removed {len(lines) - len(new_lines)} lines.")
