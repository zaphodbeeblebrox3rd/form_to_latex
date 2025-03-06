const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('.'));

// Ensure the entries directory exists
const entriesDir = path.join(__dirname, 'entries');
fs.mkdir(entriesDir, { recursive: true }).catch(console.error);

app.post('/api/entry', async (req, res) => {
    try {
        const now = new Date();
        const fileName = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.odd`;
        const filePath = path.join(entriesDir, fileName);

        // Check if file exists
        let fileExists = false;
        try {
            await fs.access(filePath);
            fileExists = true;
        } catch (error) {
            // File doesn't exist
        }

        // Format the entry
        let content = req.body.entry;
        
        if (!fileExists) {
            // Add header for new files
            const header = `# updated ${now.toISOString().split('T')[0]} mms // FIRST LINE MUST NOT CONTAIN DATA!\n\n`;
            content = header + content;
        } else {
            // Add newline before new entry
            content = '\n' + content;
        }

        // Append or create file
        await fs.appendFile(filePath, content);
        
        res.json({ success: true, fileName });
    } catch (error) {
        console.error('Error saving entry:', error);
        res.status(500).json({ error: 'Failed to save entry' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 