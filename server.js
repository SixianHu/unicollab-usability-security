const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { pool, initDatabase } = require('./db');
const {protection,createSession,endSession}=require('./local-session');

const app = express();
const PORT = process.env.PORT || 8443;

app.use(protection);
app.use(express.static(require('path').join(__dirname,'public')));
app.use(cors());
app.use(express.json());

const certsPath = path.join(__dirname, 'certs');
function developmentTlsOptions() { return {
  key: fs.readFileSync(process.env.LOCAL_TLS_KEY_PATH || path.join(certsPath,'server.key')),
  cert: fs.readFileSync(process.env.LOCAL_TLS_CERT_PATH || path.join(certsPath,'server.crt')),
}; }

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/register', async (req, res) => {
  const { fullName, studentId, email, password } = req.body;

  if (!fullName || !studentId || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all required fields.'
    });
  }

  try {
    const [existingRows] = await pool.query(
      'SELECT id FROM users WHERE student_id = ? LIMIT 1',
      [studentId]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This student ID is already registered.'
      });
    }

    // Existing coursework bcrypt generates a random salt and embeds it in the hash.
    const passwordHash = await bcrypt.hash(password, 10); // Existing coursework mechanism restored after demonstration changes.

    await pool.query(
      'INSERT INTO users (student_id, full_name, email, password_hash) VALUES (?, ?, ?, ?)',
      [studentId, fullName, email, passwordHash]
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful.'
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed on server.'
    });
  }
});

app.post('/login', async (req, res) => {
  const { studentId, password } = req.body;

  if (!studentId || !password) {
    return res.status(400).json({
      success: false,
      message: 'Student ID and password are required.'
    });
  }

  try {
    const [rows] = await pool.query(
      'SELECT student_id, full_name, email, password_hash FROM users WHERE student_id = ? LIMIT 1',
      [studentId]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid student ID or password.'
      });
      }

    const user = rows[0];
    
    // Use bcrypt to compare the password with the hashed password
     const isPasswordValid = await bcrypt.compare(password, user.password_hash);


    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid student ID or password.'
      });
    }

    createSession(req,res,user);
    return res.json({
      success: true,
      message: 'Logged in successfully via HTTPS!',
      user: {
        studentId: user.student_id,
        fullName: user.full_name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed on server.'
    });
  }
});

// Lookup a user by studentId (used when adding project members).
app.get('/user', async (req, res) => {
  const studentId = String(req.query.studentId || '').trim();

  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: 'studentId is required.',
    });
  }

  try {
    const [rows] = await pool.query(
      'SELECT student_id, full_name FROM users WHERE student_id = ? LIMIT 1',
      [studentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.json({
      success: true,
      user: {
        studentId: rows[0].student_id,
        fullName: rows[0].full_name,
      },
    });
  } catch (error) {
    console.error('User lookup error:', error);
    return res.status(500).json({
      success: false,
      message: 'User lookup failed on server.',
    });
  }
});

app.post('/logout',(req,res)=>{endSession(req,res);return res.json({success:true});});
async function startServer() {
  try {
    if (process.env.LOCAL_DEMO_DB_ENABLED !== 'true') throw new Error('Local DB demo disabled; review setup and authorize a synthetic localhost database first.');
    await initDatabase();
    console.log('Database ready: users table is available.');

    https.createServer(developmentTlsOptions(), app).listen(PORT, '127.0.0.1', () => {
      console.log(`HTTPS Backend Server running at https://localhost:${PORT}/`);
      console.log('Local development TLS only; do not change the operating-system trust store.');
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

if (require.main === module) startServer();
module.exports = { app, startServer };