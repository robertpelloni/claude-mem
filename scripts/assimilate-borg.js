import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processFile(filePath) {
    // skip node_modules, .git, dist, etc
    if (filePath.includes('node_modules') || filePath.includes('.git') || filePath.includes('dist') || filePath.includes('.mcp.json')) {
        return;
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        // Replace logic
        newContent = newContent.replace(/borg-extension/g, 'borg-extension');
        newContent = newContent.replace(/Borg-Extension/g, 'Borg-Extension');
        newContent = newContent.replace(/\.borg-extension/g, '.borg');
        newContent = newContent.replace(/borg-engine/g, 'borg-engine');

        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    } catch (e) {
        // likely binary or non-utf8
    }
}

// target directories/files
const targets = [
    'src',
    'plugin',
    'vscode-extension/src',
    'vscode-extension/package.json',
    'package.json',
    'README.md',
    'VISION.md',
    'scripts'
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

console.log("Assimilation replacement complete.");
