// C:\Users\ASUS\dream2build-backend\server.js

require('dotenv').config(); // ✅ Chargement des variables depuis le fichier .env

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

// Import the loadAllData function from your dataLoader.js file.
// This assumes dataLoader.js is directly inside your 'data' folder.
const { loadAllData } = require('./data/dataLoader');

const app = express();

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'default_secret_key';

app.use(bodyParser.json());
app.use(cors());

// Define your static files directory (if you have one, e.g., for a frontend build)
// app.use(express.static(path.join(__dirname, 'public')));

// Example:
const DATA_DIR = path.join(__dirname, 'data');

// --- Define your API routes here ---

// Middleware to verify JWT token (for protected routes)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.error('JWT verification failed:', err.message);
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = user; // Attach user payload to request
        next();
    });
};

// Example Route: A simple GET endpoint
app.get('/api/status', (req, res) => {
    res.json({ message: 'Backend is running smoothly!', status: 'ok' });
});

// Example Route: A route to get some data (e.g., from a JSON file in your 'data' folder)
app.get('/api/some-data', async (req, res) => {
    try {
        const filePath = path.join(DATA_DIR, 'sample.json');
        await fs.access(filePath);
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`Error: 'sample.json' not found at ${filePath}`);
            res.status(404).json({ message: 'Data file not found.', error: error.message });
        } else {
            console.error('Error fetching some-data:', error);
            res.status(500).json({ message: 'Internal server error while fetching data.', error: error.message });
        }
    }
});

// Example Route: User Registration
app.post('/api/register', async (req, res) => {
    const { username, password, firstName, lastName, phoneNumber, referralCode } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const newUser = { id: uuidv4(), username, password, firstName, lastName, phoneNumber, referralCode, role: 'user', isPaid: false, isActive: true };
    const usersFilePath = path.join(DATA_DIR, 'users.json');

    try {
        let users = [];
        try {
            const data = await fs.readFile(usersFilePath, 'utf8');
            users = JSON.parse(data);
        } catch (readError) {
            if (readError.code !== 'ENOENT') {
                throw readError;
            }
        }

        if (users.some(user => user.username === username)) {
            return res.status(409).json({ message: 'Username already exists.' });
        }

        users.push(newUser);
        await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
        res.status(201).json({ message: 'User registered successfully!', user: { id: newUser.id, username: newUser.username, fullName: `${firstName} ${lastName}` } });

    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
});

// Example Route: User Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const usersFilePath = path.join(DATA_DIR, 'users.json');
    try {
        const data = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(data);

        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role || 'user' }, SECRET_KEY, { expiresIn: '1h' });

        res.json({ message: 'Login successful!', token, role: user.role || 'user', fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
});

// Example Route: Submit Payment Info (Backend logic for this)
app.post('/api/submit-payment', authenticateToken, async (req, res) => {
    const { email, method } = req.body;
    console.log(`Payment submitted for ${email} via ${method}. Awaiting validation.`);
    res.json({ message: 'Payment information received. Awaiting validation by a team leader.' });
});

// Example Route: Contact Admin
app.post('/api/contact-admin', async (req, res) => {
    const { email, subject, message } = req.body;
    if (!email || !subject || !message) {
        return res.status(400).json({ message: 'Email, subject, and message are required.' });
    }
    console.log(`New message from ${email} - Subject: ${subject} - Message: ${message}`);
    res.json({ message: 'Your message has been sent to support.' });
});

// Leader Login Route
app.post('/api/leader-login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Email and password are required for leader login.' });
    }

    const usersFilePath = path.join(DATA_DIR, 'users.json');
    try {
        const data = await fs.readFile(usersFilePath, 'utf8');
        const users = JSON.parse(data);

        const leader = users.find(u => u.username === username && u.password === password && u.role === 'leader');

        if (!leader) {
            return res.status(401).json({ message: 'Invalid credentials or not authorized as a leader.' });
        }

        const token = jwt.sign({ id: leader.id, username: leader.username, role: 'leader' }, SECRET_KEY, { expiresIn: '1h' });

        res.json({ message: 'Leader login successful!', token, role: 'leader', fullName: `${leader.firstName || ''} ${leader.lastName || ''}`.trim() || leader.username });

    } catch (error) {
        console.error('Error during leader login:', error);
        res.status(500).json({ message: 'Server error during leader login.', error: error.message });
    }
});

// CEO Login Route
app.post('/api/ceo-login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Email and password are required for CEO login.' });
    }

    if (username === process.env.CEO_EMAIL && password === process.env.CEO_PASSWORD) {
        const token = jwt.sign({ id: 'ceo_id', username: username, role: 'ceo' }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: 'CEO login successful!', token, role: 'ceo', fullName: 'CEO Admin' });
    } else {
        res.status(401).json({ message: 'Invalid CEO credentials.' });
    }
});

// --- NEW ADD ADMIN ROUTE (FOR CEO) ---
app.post('/api/ceo/add-admin', authenticateToken, async (req, res) => {
    // Ensure only CEO can access this route
    if (req.user.role !== 'ceo') {
        return res.status(403).json({ message: 'Access denied. Only CEO can add new admins.' });
    }

    const { username, password, firstName, lastName, phoneNumber, role = 'leader' } = req.body; // Default new admin to 'leader' role
    if (!username || !password || !firstName || !lastName || !phoneNumber) {
        return res.status(400).json({ message: 'All fields (username, password, first name, last name, phone number) are required for new admin.' });
    }

    const usersFilePath = path.join(DATA_DIR, 'users.json');
    try {
        let users = [];
        try {
            const data = await fs.readFile(usersFilePath, 'utf8');
            users = JSON.parse(data);
        } catch (readError) {
            if (readError.code !== 'ENOENT') {
                throw readError;
            }
        }

        if (users.some(user => user.username === username)) {
            return res.status(409).json({ message: 'Admin with this email already exists.' });
        }

        // In a real app, hash the password using bcrypt before saving!
        const newAdmin = {
            id: uuidv4(),
            username,
            password, // Store hashed password in production!
            firstName,
            lastName,
            phoneNumber,
            role: role, // Can be 'leader' or potentially 'admin' if you have multiple admin roles
            isPaid: true, // Admins are typically considered paid/active
            isActive: true
        };

        users.push(newAdmin);
        await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf8');

        res.status(201).json({ message: 'New admin added successfully!', admin: { id: newAdmin.id, username: newAdmin.username, fullName: `${firstName} ${lastName}` } });

    } catch (error) {
        console.error('Error adding new admin:', error);
        res.status(500).json({ message: 'Server error when adding new admin.', error: error.message });
    }
});


// Example Route: Protected Data (requires authentication)
app.get('/api/protected-data', authenticateToken, (req, res) => {
    res.json({
        message: `Welcome, ${req.user.username}! This is protected data.`,
        data: {
            sensitiveInfo: 'This is highly confidential!',
            userId: req.user.id,
            userRole: req.user.role
        }
    });
});

// --- END OF YOUR API ROUTES ---


// --- START OF ERROR HANDLING MIDDLEWARE ---

// 404 Not Found Handler: This middleware will catch any requests that don't match existing routes.
app.use((req, res, next) => {
    res.status(404).json({
        message: 'Endpoint Not Found',
        path: req.originalUrl,
        method: req.method
    });
});

// General Error Handler: This catches any errors thrown by your routes or other middleware.
// It should be the last middleware in your chain.
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
    res.status(err.statusCode || 500).json({
        message: err.message || 'An unexpected error occurred',
        error: process.env.NODE_ENV === 'production' ? {} : err.stack // Provide stack trace in dev
    });
});

// --- END OF ERROR HANDLING MIDDLEWARE ---


// Start the server only after initial data is loaded
loadAllData().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log('Backend ready. Ensure your frontend is pointing to this address.');
    });
}).catch(err => {
    console.error('Failed to load initial data or start server:', err);
    process.exit(1); // Exit the process if critical initial data loading fails
});
