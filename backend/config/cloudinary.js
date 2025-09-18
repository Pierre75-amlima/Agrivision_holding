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

export { cloudinary, storage };