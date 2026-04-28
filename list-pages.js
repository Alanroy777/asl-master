
const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walk(filePath, fileList);
        } else {
            if (file === 'page.tsx') {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

const pages = walk('src/app');
console.log('Available Pages:');
pages.forEach(p => console.log(p.replace(/\\/g, '/')));
