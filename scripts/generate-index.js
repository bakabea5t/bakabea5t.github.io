// generate-index.js - Auto-generate posts/index.json from post files
const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '../posts');
const indexPath = path.join(postsDir, 'index.json');

// Read all JSON files in posts directory (except index.json)
const postFiles = fs.readdirSync(postsDir)
    .filter(file => file.endsWith('.json') && file !== 'index.json')
    .map(file => {
        const filePath = path.join(postsDir, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        return {
            id: content.id,
            title: content.title,
            date: content.date,
            tags: content.tags || []
        };
    })
    // Sort by date (newest first)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

// Write index.json
fs.writeFileSync(indexPath, JSON.stringify(postFiles, null, 2));
console.log(`✓ Generated posts/index.json with ${postFiles.length} posts`);
