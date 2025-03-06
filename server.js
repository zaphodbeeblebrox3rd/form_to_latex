const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.static('.'));

// Ensure the entries directory exists
const entriesDir = path.join(__dirname, 'entries');
fs.mkdir(entriesDir, { recursive: true }).catch(console.error);

// Middleware to ensure user has a cookie
app.use((req, res, next) => {
    if (!req.cookies.userId) {
        // Generate a new user ID if none exists
        const userId = uuidv4();
        res.cookie('userId', userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
        });
        req.cookies.userId = userId;
        
        // Create user directory
        const userDir = path.join(entriesDir, userId);
        fs.mkdir(userDir, { recursive: true }).catch(console.error);
    }
    next();
});

// Helper function to check if a file is within the last 7 days
function isWithinLastWeek(filename) {
    // Extract date from filename (YYYYMMDD.odd)
    const match = filename.match(/^(\d{4})(\d{2})(\d{2})\.odd$/);
    if (!match) return false;
    
    const fileDate = new Date(match[1], parseInt(match[2]) - 1, match[3]);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    return fileDate >= weekAgo && fileDate <= now;
}

// Helper function to get user's directory
function getUserDir(userId) {
    return path.join(entriesDir, userId);
}

// Endpoint to list available files
app.get('/api/files', async (req, res) => {
    try {
        const userDir = getUserDir(req.cookies.userId);
        
        // Ensure user directory exists
        await fs.mkdir(userDir, { recursive: true });
        
        const files = await fs.readdir(userDir);
        const recentFiles = files
            .filter(file => file.endsWith('.odd') && isWithinLastWeek(file))
            .sort((a, b) => b.localeCompare(a)); // Sort newest first

        const fileDetails = await Promise.all(recentFiles.map(async file => {
            const stats = await fs.stat(path.join(userDir, file));
            return {
                name: file,
                date: file.slice(0, 8), // YYYYMMDD
                size: stats.size
            };
        }));

        res.json(fileDetails);
    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// Endpoint to download a file
app.get('/api/files/:filename', async (req, res) => {
    const filename = req.params.filename;
    const userDir = getUserDir(req.cookies.userId);
    const filePath = path.join(userDir, filename);

    // Security check: verify filename format and recency
    if (!filename.match(/^\d{8}\.odd$/) || !isWithinLastWeek(filename)) {
        return res.status(403).json({ error: 'File access denied' });
    }

    try {
        await fs.access(filePath);
        res.download(filePath);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(404).json({ error: 'File not found' });
    }
});

app.post('/api/entry', async (req, res) => {
    try {
        const now = new Date();
        const fileName = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.odd`;
        const userDir = getUserDir(req.cookies.userId);
        const filePath = path.join(userDir, fileName);

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

// Endpoint to clear user data (optional)
app.post('/api/clear-data', async (req, res) => {
    try {
        const userDir = getUserDir(req.cookies.userId);
        await fs.rm(userDir, { recursive: true, force: true });
        await fs.mkdir(userDir, { recursive: true });
        res.clearCookie('userId');
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing user data:', error);
        res.status(500).json({ error: 'Failed to clear user data' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 