import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// NOUVEAU : Stockage mémoire au lieu de CloudinaryStorage
const memoryStorage = multer.memoryStorage();

// Middleware Multer avec stockage mémoire
export const upload = multer({
  storage: memoryStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    console.log('--- MULTER MEMORY STORAGE ---');
    console.log('Fichier reçu :', file.originalname);
    console.log('Type MIME :', file.mimetype);
    
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF et images sont autorisés'), false);
    }
  }
});

// NOUVELLE FONCTION : Upload direct vers Cloudinary depuis le buffer
export const uploadToCloudinary = (buffer, originalname, mimetype) => {
  return new Promise((resolve, reject) => {
    const isPdf = mimetype === 'application/pdf';
    const folder = isPdf ? 'agrivision/cvs' : 'agrivision/images';
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: isPdf ? 'raw' : 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        access_mode: 'public',
        public_id: `${Date.now()}_${originalname.split('.')[0]}`,
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) {
          console.error('Erreur upload Cloudinary:', error);
          reject(error);
        } else {
          console.log('Upload Cloudinary réussi:', result.secure_url);
          resolve(result);
        }
      }
    );
    
    // Envoyer le buffer vers Cloudinary
    uploadStream.end(buffer);
  });
};

// GARDE : Fonction utilitaire pour construire les URLs correctes (si nécessaire)
export const getCloudinaryUrl = (publicId, resourceType = 'image') => {
  if (!publicId) return null;
  
  const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}`;
  
  let type = 'image';
  if (resourceType === 'raw' || resourceType === 'pdf') {
    type = 'raw';
  } else if (resourceType === 'image') {
    type = 'image';
  }
  
  if (publicId.startsWith('http')) {
    return publicId;
  }
  
  return `${baseUrl}/${type}/upload/${publicId}`;
};

// GARDE : Fonction pour déterminer le type de ressource
export const getResourceType = (filename, mimetype = '') => {
  if (!filename && !mimetype) return 'image';
  
  if (mimetype === 'application/pdf') return 'raw';
  if (mimetype.startsWith('image/')) return 'image';
  
  const ext = filename ? filename.toLowerCase().split('.').pop() : '';
  return ext === 'pdf' ? 'raw' : 'image';
};

export { cloudinary };