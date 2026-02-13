require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in .env');
  process.exit(1);
}
if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined in .env');
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
mongoose.connect(MONGO_URI, { family: 4 })
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
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const AssetSchema = new mongoose.Schema({
  name: String,
  type: String,
  size: String,
  sizeBytes: Number, // For storage calc
  uploadDate: { type: Date, default: Date.now },
  tags: [String],
  url: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  visibility: { type: String, enum: ['private', 'shared', 'public'], default: 'private' },
  pin: String, // Hashed PIN for private/shared files
  shareToken: { type: String, unique: true, sparse: true }, // For shared links
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 }
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

const adminAuth = async (req, res, next) => {
  auth(req, res, async () => {
    try {
      const user = await User.findById(req.user._id);
      if (user && user.role === 'admin') {
        next();
      } else {
        res.status(403).send('Admin Access Required');
      }
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
};

// --- Routes ---

// Auth: Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).send('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Auto-make admin if email contains 'admin' or is a designated admin email
    const adminEmails = ['logesh2046@gmail.com'];
    const role = (email.includes('admin') || adminEmails.includes(email)) ? 'admin' : 'user';

    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    const token = jwt.sign({ _id: user._id, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).send(err.message);
  }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('Email not found');

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).send('Invalid password');

    const token = jwt.sign({ _id: user._id, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).send(err.message);
  }
});

// Auth: Get Current User
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// --- Admin Routes --- (Protected)

app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAssets = await Asset.countDocuments();

    // Aggregate storage
    const storageStats = await Asset.aggregate([
      { $group: { _id: null, totalSize: { $sum: "$sizeBytes" } } }
    ]);
    const totalStorage = storageStats[0]?.totalSize || 0;

    const typeDistribution = await Asset.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);

    const recentUploads = await Asset.find()
      .sort({ uploadDate: -1 })
      .limit(5)
      .populate('userId', 'name email');

    res.json({
      totalUsers,
      totalAssets,
      totalStorage,
      typeDistribution,
      recentUploads
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.delete('/api/admin/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (user) {
      // Delete user's assets
      await Asset.deleteMany({ userId: user._id });
    }
    res.json({ message: 'User and their assets deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// --- Asset Routes ---

// Upload
app.post('/api/assets/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded');

    const { name, type, size, tags, visibility, pin } = req.body;
    const url = `http://localhost:${PORT}/uploads/${req.file.filename}`;

    let hashedPin = null;
    if (pin && (visibility === 'private' || visibility === 'shared')) {
      hashedPin = await bcrypt.hash(pin, 10);
    }

    let shareToken = null;
    if (visibility === 'shared') {
      shareToken = crypto.randomBytes(16).toString('hex');
    }

    const asset = new Asset({
      name,
      type,
      size,
      sizeBytes: req.file.size,
      uploadDate: new Date(),
      tags: JSON.parse(tags || '[]'),
      url,
      userId: req.user._id,
      visibility: visibility || 'private',
      pin: hashedPin,
      shareToken
    });

    await asset.save();
    res.json(asset);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// Get Assets (User's own)
app.get('/api/assets', auth, async (req, res) => {
  try {
    const assets = await Asset.find({ userId: req.user._id }).sort({ _id: -1 });

    // Map for frontend
    const formattedAssets = assets.map(asset => ({
      id: asset._id,
      name: asset.name,
      type: asset.type,
      size: asset.size,
      uploadDate: asset.uploadDate.toISOString().split('T')[0],
      tags: asset.tags,
      url: asset.url,
      visibility: asset.visibility,
      hasPin: !!asset.pin,
      shareToken: asset.shareToken
    }));
    res.json(formattedAssets);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete Asset
app.delete('/api/assets/:id', auth, async (req, res) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, userId: req.user._id });
    if (!asset) return res.status(404).send('Asset not found');

    // Verify PIN if required for deletion (optional, but requested in rules: "Require PIN to ... Delete")
    // If it's private/shared, we might want to ask for PIN before delete.
    // For now, let's assume the frontend pre-verifies or we skip for delete from owner dashboard for UX, 
    // BUT the requirement says "Require PIN to ... delete".
    // Let's check headers for 'x-asset-pin' if the asset is protected.

    if (asset.pin) {
      const pin = req.header('x-asset-pin');
      if (!pin) return res.status(403).send('PIN required');
      const valid = await bcrypt.compare(pin, asset.pin);
      if (!valid) return res.status(403).send('Invalid PIN');
    }

    await Asset.findByIdAndDelete(req.params.id);

    // Delete file
    const filename = asset.url.split('/').pop();
    const filePath = path.join(__dirname, 'uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Generate/Regenerate Share Link
app.post('/api/assets/:id/share', auth, async (req, res) => {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, userId: req.user._id });
    if (!asset) return res.status(404).send('Not found');

    asset.visibility = 'shared';
    if (!asset.shareToken) {
      asset.shareToken = crypto.randomBytes(16).toString('hex');
    }
    await asset.save();
    res.json({ shareToken: asset.shareToken });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// --- Public / Shared Routes ---

// Get Shared Asset Info via Token
app.get('/api/share', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Token required');

    const asset = await Asset.findOne({ shareToken: token }).populate('userId', 'name');
    if (!asset) return res.status(404).send('Asset not found');

    // Check constraints? NO, this is public info (metadata).
    // But DON'T return the actual URL if PIN is set.

    const isProtected = !!asset.pin;

    // If 'public', or 'shared' without PIN, we might return URL?
    // Requirement says: "SHARED... Optional PIN... Accessible only via link... Require PIN if enabled"

    const responseData = {
      id: asset._id,
      name: asset.name,
      type: asset.type,
      size: asset.size,
      ownerName: asset.userId.name,
      isProtected,
      uploadDate: asset.uploadDate
    };

    if (!isProtected) {
      responseData.url = asset.url; // Safe to show if no PIN
      // Increment views
      asset.views += 1;
      await asset.save();
    }

    res.json(responseData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Verify PIN and Access Shared Asset
app.post('/api/share/access', async (req, res) => {
  try {
    const { token, pin } = req.body;
    const asset = await Asset.findOne({ shareToken: token });

    if (!asset) return res.status(404).send('Asset not found');

    if (asset.pin) {
      if (!pin) return res.status(403).send('PIN required');
      const valid = await bcrypt.compare(pin, asset.pin);
      if (!valid) return res.status(403).send('Invalid PIN');
    }

    // Increment views/downloads?
    asset.views += 1;
    await asset.save();

    res.json({ url: asset.url });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Verify PIN for Owner/User Access (e.g. before download)
app.post('/api/assets/:id/verify-pin', auth, async (req, res) => {
  try {
    const { pin } = req.body;
    console.log(`[Verify-PIN] Request for Asset ID: ${req.params.id}`);
    console.log(`[Verify-PIN] Received PIN: '${pin}'`);

    const asset = await Asset.findOne({ _id: req.params.id });

    if (!asset) {
      console.log('[Verify-PIN] Asset not found');
      return res.status(404).send('Asset not found');
    }

    console.log(`[Verify-PIN] Asset found: ${asset.name}, Has PIN: ${!!asset.pin}`);

    // If user is owner, they might not need PIN, but to be safe/consistent with UI request:
    if (asset.pin) {
      if (!pin) {
        console.log('[Verify-PIN] No PIN provided');
        return res.status(403).send('PIN required');
      }

      const cleanPin = String(pin).trim();
      console.log(`[Verify-PIN] Comparing '${cleanPin}' with hash...`);

      const valid = await bcrypt.compare(cleanPin, asset.pin);

      if (!valid) {
        console.log('[Verify-PIN] Invalid PIN');
        return res.status(403).send('Invalid PIN');
      }
      console.log('[Verify-PIN] PIN Valid!');
    } else {
      console.log('[Verify-PIN] Asset has no PIN protected');
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Verify-PIN] Error:', err);
    res.status(500).send(err.message);
  }
});

// --- Admin Global Stats ---
// (Already covered above in /api/admin/stats)
