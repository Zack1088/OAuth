// image-server/controllers/image.controller.js
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Configuration des filtres pour les fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

exports.uploadMiddleware = upload.single('image');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucune image fournie' 
      });
    }

    const imageUrl = `${process.env.SERVER_URL}/uploads/${req.file.filename}`;

    // Enregistrer l'URL de l'image dans la base de données si nécessaire
    const imageDoc = await Image.create({
      url: imageUrl,
      filename: req.file.filename,
      clientId: req.clientId,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    res.status(201).json({
      success: true,
      data: {
        url: imageUrl,
        id: imageDoc._id,
        filename: req.file.filename
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getImage = async (req, res) => {
  try {
    const image = await Image.findOne({ filename: req.params.filename });
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image non trouvée'
      });
    }

    res.sendFile(path.join(__dirname, '../uploads', image.filename));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const image = await Image.findOne({ 
      filename: req.params.filename,
      clientId: req.clientId 
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image non trouvée'
      });
    }

    // Supprimer le fichier physique
    await fs.unlink(path.join(__dirname, '../uploads', image.filename));
    
    // Supprimer l'entrée de la base de données
    await image.remove();

    res.json({
      success: true,
      message: 'Image supprimée avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllImages = async (req, res) => {
  try {
    const images = await Image.find({ clientId: req.clientId })
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: images
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};