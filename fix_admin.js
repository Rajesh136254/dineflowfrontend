const fs = require('fs');
const path = "c:\\Users\\Rajeswara\\Downloads\\EndOfHunger\\dineflowreact\\src\\pages\\AdminPage.js";

try {
    const content = fs.readFileSync(path, 'utf8');
    // Handle both CRLF and LF
    const lines = content.split(/\r?\n/);

    const linesToRemove = new Set();
    const addRange = (start, end) => {
        for (let i = start; i <= end; i++) linesToRemove.add(i);
    };

    addRange(251, 253);
    addRange(350, 352);
    addRange(368, 369);
    addRange(413, 414);
    addRange(428, 429);
    addRange(438, 439);

    const newLines = lines.filter((_, index) => !linesToRemove.has(index + 1));

    // Join with original line ending if possible, or just \n
    fs.writeFileSync(path, newLines.join('\n'), 'utf8');
    console.log(`Removed ${lines.length - newLines.length} lines.`);
} catch (err) {
    console.error(err);
}
