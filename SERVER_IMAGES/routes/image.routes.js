// routes/image.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuration stockage existante...
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Seules les images sont autorisées'));
  }
});

// Route pour lister toutes les images
router.get('/', async (req, res) => {
  try {
    console.log('Liste des images demandée');
    const files = await fs.readdir('uploads/');
    
    const images = files.map(filename => {
      return {
        filename,
        url: `${process.env.SERVER_URL || 'http://localhost:4000'}/uploads/${filename}`
      };
    });

    res.json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error('Erreur liste des images:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Route pour obtenir une image 
router.get('/:filename', async (req, res) => {
  try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '../uploads', filename);

      // Vérifier si le fichier existe
      try {
          await fs.access(filePath);
      } catch (error) {
          return res.status(404).json({
              success: false,
              message: 'Image non trouvée'
          });
      }

      // Obtenir les informations sur le fichier
      const stats = await fs.stat(filePath);
      const fileInfo = {
          filename,
          url: `${process.env.SERVER_URL || 'http://localhost:4000'}/uploads/${filename}`,
          size: stats.size,
          created: stats.birthtime,
          lastModified: stats.mtime
      };

      res.json({
          success: true,
          data: fileInfo
      });
  } catch (error) {
      console.error('Erreur récupération image:', error);
      res.status(500).json({
          success: false,
          message: error.message
      });
  }
});

// Route upload image
router.post('/upload', upload.single('image'), (req, res) => {
  console.log('Upload route called');
  console.log('Request file:', req.file);
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucune image fournie' 
      });
    }

    const imageUrl = `${process.env.SERVER_URL || 'http://localhost:4000'}/uploads/${req.file.filename}`;
    
    res.status(201).json({
      success: true,
      data: {
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Route pour mettre à jour une image
router.put('/:filename', upload.single('image'), async (req, res) => {
  try {
      console.log('Mise à jour image appelée');
      const { filename } = req.params;
      const oldFilePath = path.join(__dirname, '../uploads', filename);

      // Vérifier si l'ancienne image existe
      try {
          await fs.access(oldFilePath);
      } catch (error) {
          return res.status(404).json({
              success: false,
              message: 'Image originale non trouvée'
          });
      }

      // Vérifier si une nouvelle image est fournie
      if (!req.file) {
          return res.status(400).json({
              success: false,
              message: 'Aucune nouvelle image fournie'
          });
      }

      // Supprimer l'ancienne image
      await fs.unlink(oldFilePath);

      // Construire l'URL de la nouvelle image
      const imageUrl = `${process.env.SERVER_URL || 'http://localhost:4000'}/uploads/${req.file.filename}`;

      res.json({
          success: true,
          message: 'Image mise à jour avec succès',
          data: {
              oldFilename: filename,
              newFilename: req.file.filename,
              url: imageUrl,
              originalName: req.file.originalname,
              size: req.file.size,
              mimetype: req.file.mimetype,
              updatedAt: new Date().toISOString()
          }
      });
  } catch (error) {
      console.error('Erreur mise à jour image:', error);
      res.status(500).json({
          success: false,
          message: error.message
      });
  }
});

// Route pour supprimer une image
router.delete('/:filename', async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../uploads', filename);

  console.log(`Requête DELETE reçue pour : ${filename} à ${new Date().toISOString()}`);

  try {
      // Vérifie si le fichier existe
      try {
          await fs.access(filePath);
      } catch (error) {
          console.warn(`Fichier introuvable pour suppression : ${filename}`);
          return res.status(404).json({
              success: false,
              message: 'Image non trouvée'
          });
      }

      // Supprime le fichier
      await fs.unlink(filePath);
      console.log(`Image supprimée avec succès : ${filename}`);

      res.json({
          success: true,
          message: 'Image supprimée avec succès',
          data: {
              filename,
              deletedAt: new Date().toISOString()
          }
      });
  } catch (error) {
      console.error(`Erreur suppression image (${filename}):`, error.message);
      res.status(500).json({
          success: false,
          message: error.message
      });
  }
});

module.exports = router;