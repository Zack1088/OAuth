// middleware/upload.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier tmp s'il n'existe pas
const uploadDir = path.join(process.cwd(), 'tmp', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configuration de multer
const multerUpload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Format de fichier non supporté. Utilisez JPG, PNG ou GIF.'));
    }
});

// Créer un objet avec les différentes méthodes d'upload
const upload = {
    single: multerUpload.single.bind(multerUpload),
    array: multerUpload.array.bind(multerUpload),
    fields: multerUpload.fields.bind(multerUpload),
};

module.exports = upload;