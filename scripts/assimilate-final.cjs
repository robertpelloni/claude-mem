const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processFile(filePath) {
    if (filePath.includes('node_modules') || filePath.includes('.git') || filePath.includes('dist')) {
        return;
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        newContent = newContent.replace(/claude-code\.js/g, 'borg-engine.js');
        newContent = newContent.replace(/claude-code\.ts/g, 'borg-engine.ts');
        newContent = newContent.replace(/'claude-code'/g, "'borg-engine'");
        newContent = newContent.replace(/claudeCodeAdapter/g, 'borgEngineAdapter');

        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated Final: ${filePath}`);
        }
    } catch (e) { }
}

const targets = [
    'src',
    'tests',
    'plugin'
];

targets.forEach(target => {
    const fullPath = path.resolve(__dirname, '..', target);
    if (!fs.existsSync(fullPath)) return;

    if (fs.statSync(fullPath).isDirectory()) {
        walkDir(fullPath, processFile);
    } else {
        processFile(fullPath);
    }
});

console.log("Final replacement complete.");
