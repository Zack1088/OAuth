// src/config/multer.js

// *** PS: Ce code est a utilisé en cas d'upload local, on rajoute le middleware dans app.js ***

// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Vérification/création du dossier uploads
// const uploadDir = path.join(process.cwd(), 'public', 'uploads');
// if (!fs.existsSync(uploadDir)) {
//     console.log('Création du dossier uploads:', uploadDir);
//     fs.mkdirSync(uploadDir, { recursive: true });
// }

// console.log('Dossier uploads configuré:', uploadDir);

// // Configuration du stockage
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         console.log('Destination pour le fichier:', file.originalname);
//         console.log('Dossier de destination:', uploadDir);
//         cb(null, uploadDir);
//     },
//     filename: (req, file, cb) => {
//         console.log('Génération du nom de fichier pour:', file.originalname);
//         // Nettoyage du nom de fichier original
//         const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
//         const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
//         const finalFileName = `${file.fieldname}-${uniqueSuffix}${path.extname(cleanFileName).toLowerCase()}`;
//         console.log('Nom de fichier généré:', finalFileName);
//         cb(null, finalFileName);
//     }
// });

// // Filtre des fichiers
// const fileFilter = (req, file, cb) => {
//     console.log('\n=== Début de la validation du fichier ===');
//     console.log('Fichier reçu:', {
//         nom: file.originalname,
//         type: file.mimetype,
//         taille: file.size
//     });

//     // Liste des types MIME autorisés
//     const allowedMimes = {
//         'image/jpeg': ['.jpg', '.jpeg'],
//         'image/png': ['.png'],
//         'image/gif': ['.gif']
//     };

//     console.log('Types MIME autorisés:', Object.keys(allowedMimes));

//     // Vérification du type MIME
//     const allowedExtensions = allowedMimes[file.mimetype];
//     if (!allowedExtensions) {
//         console.log('❌ Type MIME non autorisé:', file.mimetype);
//         return cb(new Error(`Format de fichier non supporté (${file.mimetype}). Utilisez JPG, JPEG, PNG ou GIF.`), false);
//     }

//     // Vérification de l'extension
//     const ext = path.extname(file.originalname).toLowerCase();
//     console.log('Extension du fichier:', ext);
    
//     if (!allowedExtensions.includes(ext)) {
//         console.log('❌ Extension non autorisée:', ext);
//         return cb(new Error(`L'extension ${ext} ne correspond pas au type de fichier ${file.mimetype}.`), false);
//     }

//     console.log('✅ Fichier validé avec succès');
//     console.log('=== Fin de la validation du fichier ===\n');
//     cb(null, true);
// };

// // Configuration de multer
// const upload = multer({
//     storage,
//     limits: {
//         fileSize: 5 * 1024 * 1024, // 5MB max
//         files: 5 // Maximum 5 fichiers
//     },
//     fileFilter
// });

// // Gestion des erreurs multer
// const handleMulterError = (err) => {
//     console.log('\n=== Début du traitement de l\'erreur ===');
//     console.log('Type d\'erreur:', err instanceof multer.MulterError ? 'MulterError' : 'Error standard');
//     console.log('Message d\'erreur brut:', err.message);

//     const errorResponse = {
//         status: 400,
//         message: '',
//         originalError: err
//     };

//     if (err instanceof multer.MulterError) {
//         console.log('Code d\'erreur Multer:', err.code);
//         switch (err.code) {
//             case 'LIMIT_FILE_SIZE':
//                 errorResponse.message = 'Le fichier est trop volumineux. La taille maximale est de 5MB.';
//                 break;
//             case 'LIMIT_FILE_COUNT':
//                 errorResponse.message = 'Vous ne pouvez pas télécharger plus de 5 images.';
//                 break;
//             case 'LIMIT_FIELD_COUNT':
//                 errorResponse.message = 'Trop de champs de fichiers ont été envoyés.';
//                 break;
//             case 'LIMIT_UNEXPECTED_FILE':
//                 errorResponse.message = 'Type de fichier non autorisé.';
//                 break;
//             case 'LIMIT_FIELD_KEY':
//                 errorResponse.message = 'Nom de champ de fichier invalide.';
//                 break;
//             case 'MISSING_FIELD_NAME':
//                 errorResponse.message = 'Nom de champ manquant.';
//                 break;
//             default:
//                 errorResponse.message = 'Erreur lors du téléchargement des images.';
//         }
//     } else {
//         // Pour les erreurs personnalisées du fileFilter
//         errorResponse.message = err.message;
//     }

//     console.log('Message d\'erreur formaté:', errorResponse.message);
//     console.log('=== Fin du traitement de l\'erreur ===\n');

//     return errorResponse;
// };

// // Export des fonctionnalités
// const multerConfig = {
//     upload,
//     handleMulterError,
//     uploadSingle: upload.single('image'),
//     uploadMultiple: upload.array('images', 5),
//     uploadFields: upload.fields([
//         { name: 'images', maxCount: 5 }
//     ])
// };

// console.log('Configuration Multer initialisée avec succès');

// module.exports = multerConfig;