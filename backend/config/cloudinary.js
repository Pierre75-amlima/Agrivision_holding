import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Stockage Cloudinary avec debug
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    console.log('--- MULTER STORAGE ---');
    console.log('Fichier reçu :', file.originalname);
    console.log('Type MIME :', file.mimetype);

    // Choix du dossier selon type
    const folder = file.mimetype.startsWith('image/') ? 'agrivision/images' : 'agrivision/cvs';
    
    // Configuration selon le type de fichier
    const isPdf = file.mimetype === 'application/pdf';
    
    return {
      folder,
      format: isPdf ? undefined : undefined, // Laisser Cloudinary gérer le format
      resource_type: isPdf ? 'raw' : 'image',
      allowed_formats: ['jpg','jpeg','png','pdf'],
      access_mode: 'public',
      // Ajouter un public_id unique pour éviter les conflits
      public_id: `${folder}/${Date.now()}_${file.originalname.split('.')[0]}`,
    };
  },
});

// CORRECTION PRINCIPALE : Fonction utilitaire pour construire les URLs correctes
export const getCloudinaryUrl = (publicId, resourceType = 'image') => {
  if (!publicId) return null;
  
  const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}`;
  
  // Déterminer le bon type de ressource
  let type = 'image';
  if (resourceType === 'raw' || resourceType === 'pdf') {
    type = 'raw';
  } else if (resourceType === 'image') {
    type = 'image';
  }
  
  // Si l'URL est déjà complète, la retourner telle quelle
  if (publicId.startsWith('http')) {
    return publicId;
  }
  
  // Construire l'URL complète avec le bon type de ressource
  return `${baseUrl}/${type}/upload/${publicId}`;
};

// Fonction pour déterminer le type de ressource selon l'extension ou le MIME type
export const getResourceType = (filename, mimetype = '') => {
  if (!filename && !mimetype) return 'image';
  
  // Vérifier d'abord le MIME type
  if (mimetype === 'application/pdf') return 'raw';
  if (mimetype.startsWith('image/')) return 'image';
  
  // Sinon vérifier l'extension
  const ext = filename ? filename.toLowerCase().split('.').pop() : '';
  return ext === 'pdf' ? 'raw' : 'image';
};

// Middleware Multer
export const upload = multer({ storage });

export { cloudinary, storage };
