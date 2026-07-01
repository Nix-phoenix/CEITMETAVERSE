// Simple static server for frontend-only development (no DB needed)
const express = require('express');
const path = require('path');
const app = express();

const PORT = 3000;
const ROOT = path.join(__dirname, '..');

// Mirror the same static routes as the main server
app.use(express.static(ROOT));
app.use('/', express.static(path.join(ROOT, 'WebPage')));
app.use('/uploads', express.static(path.join(ROOT, 'uploads')));

app.listen(PORT, () => {
    console.log(`\n  Frontend dev server running at http://localhost:${PORT}\n`);
});
