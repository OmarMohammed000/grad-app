import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists - should be in backend/uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('📁 Saving file to:', uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log('📝 Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  console.log('🔍 Checking file type:', file.mimetype);
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image.'), false);
  }
};

export const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export const uploadImage = (req, res) => {
  console.log('📸 Upload endpoint hit!');
  console.log('📸 Request body:', req.body);
  console.log('📸 Request file:', req.file);
  
  if (!req.file) {
    console.log('❌ No file received in request');
    return res.status(400).json({ message: 'No file uploaded' });
  }

  console.log('✅ File received:', {
    filename: req.file.filename,
    path: req.file.path,
    size: req.file.size,
    mimetype: req.file.mimetype
  });

  // Construct URL - check for ngrok forwarding headers
  // ngrok sets X-Forwarded-Host or X-Original-Host to the ngrok domain
  const forwardedHost = req.get('X-Forwarded-Host') || req.get('X-Original-Host');
  const host = forwardedHost || req.get('host');
  const protocol = host.includes('ngrok') ? 'https' : req.protocol;
  const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

  console.log('🔍 URL Generation Details:');
  console.log('  - X-Forwarded-Host:', req.get('X-Forwarded-Host'));
  console.log('  - X-Original-Host:', req.get('X-Original-Host'));
  console.log('  - Host header:', req.get('host'));
  console.log('  - Selected host:', host);
  console.log('  - Protocol:', protocol);
  console.log('  - Is ngrok?:', host.includes('ngrok'));
  console.log('📤 Generated URL:', fileUrl);

  res.json({ 
    message: 'File uploaded successfully',
    url: fileUrl,
    filename: req.file.filename
  });
};
