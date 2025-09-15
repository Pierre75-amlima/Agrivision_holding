import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const migratePdfsToRaw = async () => {
  console.log('🚀 Début de la migration des PDFs...');
  
  try {
    // 1. Rechercher tous les PDFs dans le dossier cvs stockés comme 'image'
    console.log('📋 Recherche des PDFs à migrer...');
    
    // Méthode alternative : liste des ressources par dossier
    const searchResult = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image', // Chercher dans les images car c'est là qu'ils sont mal stockés
      prefix: 'agrivision/cvs/',
      max_results: 500
    });

    // Filtrer uniquement les PDFs
    const pdfResources = searchResult.resources.filter(resource => 
      resource.format === 'pdf' || resource.public_id.endsWith('.pdf')
    );

    console.log(`📁 ${pdfResources.length} PDFs trouvés à migrer`);

    if (pdfResources.length === 0) {
      console.log('✅ Aucun PDF à migrer trouvé.');
      console.log('📝 Voici toutes les ressources trouvées dans agrivision/cvs/ :');
      
      searchResult.resources.forEach((resource, index) => {
        console.log(`   ${index + 1}. ${resource.public_id} (format: ${resource.format})`);
      });
      
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    // 2. Migrer chaque PDF
    for (const resource of pdfResources) {
      try {
        console.log(`\n🔄 Migration de : ${resource.public_id}`);
        console.log(`   URL actuelle : ${resource.secure_url}`);
        console.log(`   Format : ${resource.format}`);

        // Upload comme ressource 'raw'
        const uploadResult = await cloudinary.uploader.upload(resource.secure_url, {
          resource_type: 'raw',
          public_id: resource.public_id,
          overwrite: true,
          access_mode: 'public'
        });

        console.log(`✅ Migré vers : ${uploadResult.secure_url}`);

        migratedCount++;
        
        // Pause de 200ms entre chaque migration pour éviter les limites de taux
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`❌ Erreur migration ${resource.public_id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 RÉSUMÉ DE LA MIGRATION :');
    console.log(`✅ PDFs migrés avec succès : ${migratedCount}`);
    console.log(`❌ Erreurs : ${errorCount}`);
    console.log(`📁 Total traité : ${pdfResources.length}`);

    if (migratedCount > 0) {
      console.log('\n🎉 Migration terminée ! Vos PDFs sont maintenant accessibles avec /raw/upload/');
      console.log('💡 Vous pouvez maintenant tester vos URLs corrigées.');
      console.log('\nURLs à tester :');
      pdfResources.forEach(resource => {
        const rawUrl = resource.secure_url.replace('/image/upload/', '/raw/upload/');
        console.log(`   ${rawUrl}`);
      });
    }

  } catch (error) {
    console.error('💥 Erreur globale lors de la migration:', error);
    console.error('Détail de l\'erreur:', error.message || error);
    
    if (error.http_code === 401) {
      console.error('❌ Erreur d\'authentification. Vérifiez vos clés API Cloudinary.');
    } else if (error.http_code === 400) {
      console.error('❌ Erreur dans la requête. Vérification de la syntaxe...');
    }
  }
};

// Fonction de test simple
const testConnection = async () => {
  try {
    console.log('🧪 Test de connexion Cloudinary...');
    const result = await cloudinary.api.ping();
    console.log('✅ Connexion réussie :', result);
    return true;
  } catch (error) {
    console.error('❌ Échec de connexion :', error.message);
    return false;
  }
};

// Fonction principale
const main = async () => {
  console.log('🔧 SCRIPT DE MIGRATION DES PDFs CLOUDINARY');
  console.log('=========================================\n');
  
  // Vérifier la configuration
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Variables d\'environnement Cloudinary manquantes !');
    console.log('Assurez-vous d\'avoir défini dans votre .env :');
    console.log('- CLOUDINARY_CLOUD_NAME');
    console.log('- CLOUDINARY_API_KEY'); 
    console.log('- CLOUDINARY_API_SECRET');
    process.exit(1);
  }

  console.log(`☁️  Cloud configuré : ${process.env.CLOUDINARY_CLOUD_NAME}`);
  
  // Tester la connexion d'abord
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.error('❌ Impossible de se connecter à Cloudinary. Vérifiez vos identifiants.');
    process.exit(1);
  }
  
  await migratePdfsToRaw();
  
  console.log('\n🏁 Script terminé.');
};

// Exécuter le script
main().catch(console.error);