import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuration ULTRA SIMPLE sans logs
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cvs',
    resource_type: 'raw',
    allowed_formats: ['pdf'],
    public_id: (req, file) => `${Date.now()}_${file.originalname.split('.')[0]}`
  }
});

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5000000 }
});

// Configuration Multer BASIC (stockage en mémoire)
const memoryStorage = multer.memoryStorage();

export const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 5000000 },
  fileFilter: (req, file, cb) => {
    console.log('Memory storage - File:', file.originalname);
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('PDF seulement'), false);
    }
  }
});

export { cloudinary, storage };