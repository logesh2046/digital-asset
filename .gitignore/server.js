require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in .env');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch(err => console.error('MongoDB connection error:', err));

// --- Models ---
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', UserSchema);

const AssetSchema = new mongoose.Schema({
  name: String,
  type: String,
  size: String,
  uploadDate: String,
  tags: [String],
  url: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});
const Asset = mongoose.model('Asset', AssetSchema);

// --- File Upload Configuration ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Sanitize filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '-'));
  },
});
const upload = multer({ storage });

// --- Auth Middleware ---
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send('Access Denied');

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
};

// --- Routes ---

// Auth: Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log('Signup Request Body:', req.body);
    const { name, email, password } = req.body;
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).send('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    
    const token = jwt.sign({ _id: user._id }, JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).send(err.message);
  }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login Request Body:', req.body);
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('Email not found');

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).send('Invalid password');

    const token = jwt.sign({ _id: user._id }, JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).send(err.message);
  }
});

// Auth: Get Current User (for persistence)
app.get('/api/auth/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Assets: Upload
app.post('/api/assets/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded');

    const { name, type, size, tags } = req.body;
    const url = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    
    const asset = new Asset({
      name,
      type,
      size,
      uploadDate: new Date().toISOString().split('T')[0],
      tags: JSON.parse(tags || '[]'),
      url,
      userId: req.user._id,
    });
    
    await asset.save();
    res.json(asset);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Assets: Get All
app.get('/api/assets', auth, async (req, res) => {
  try {
    const assets = await Asset.find({ userId: req.user._id }).sort({ _id: -1 });
    // Map _id to id for frontend compatibility
    const formattedAssets = assets.map(asset => ({
        id: asset._id,
        name: asset.name,
        type: asset.type,
        size: asset.size,
        uploadDate: asset.uploadDate,
        tags: asset.tags,
        url: asset.url
    }));
    res.json(formattedAssets);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Assets: Delete
app.delete('/api/assets/:id', auth, async (req, res) => {
  try {
    const asset = await Asset.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (asset) {
        // Optional: Delete file from filesystem
        const filename = asset.url.split('/').pop();
        const filePath = path.join(__dirname, 'uploads', filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
