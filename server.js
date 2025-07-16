require('dotenv').config(); // ✅ Chargement des variables depuis le fichier .env

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'default_secret_key';

app.use(bodyParser.json());
app.use(cors());

// Le reste de ton code reste inchangé à partir d’ici
// Tu peux coller ici tout le reste du contenu que tu avais dans ton `server.js` précédemment

// Exemple :
const DATA_DIR = path.join(__dirname, 'data');
// ...

// À la fin, ton lancement du serveur reste pareil
loadAllData().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log('Backend ready. Ensure your frontend is pointing to this address.');
    });
}).catch(err => {
    console.error('Failed to load initial data or start server:', err);
    process.exit(1);
});
