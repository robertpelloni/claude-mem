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
    if (filePath.includes('node_modules') || filePath.includes('.git') || filePath.includes('dist') || filePath.includes('.mcp.json')) {
        return;
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        // Replace camelCase logic and spaced logic
        newContent = newContent.replace(/borgExtension/g, 'borgExtension');
        newContent = newContent.replace(/Borg Extension/g, 'Borg Extension');
        newContent = newContent.replace(/borg_extension/g, 'borg_extension');
        newContent = newContent.replace(/BorgExtension/g, 'BorgExtension');

        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated CamelCase: ${filePath}`);
        }
    } catch (e) { }
}

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

console.log("Camel case replacement complete.");
