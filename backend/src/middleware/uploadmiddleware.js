const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Absolute path to backend/uploads
const uploadPath = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log('📁 Uploads folder verified at:', uploadPath);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `${Date.now()}_${baseName}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sirf PDF, Word Document (DOC/DOCX) aur Images (JPG/PNG) allowed hain!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

module.exports = upload;

module.exports = upload;