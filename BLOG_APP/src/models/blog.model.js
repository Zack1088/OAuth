// src/models/blog.model.js

const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Le titre est requis'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Le contenu est requis']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    images: [{
        type: String // Stocke les URLs des images
    }]
}, {
    timestamps: true
});

// Middleware pour supprimer les images distantes lors de la suppression d'un blog
blogSchema.pre('findOneAndDelete', async function (next) {
    const imageService = require('../services/image.service'); 

    try {
        const doc = await this.model.findOne(this.getQuery());
        if (doc && doc.images.length > 0) {
            for (const imageUrl of doc.images) {
                try {
                    console.log(`Suppression de l'image distante : ${imageUrl}`);
                    await imageService.deleteImage(imageUrl); // Supprime l'image sur le serveur distant
                } catch (error) {
                    console.error(`Erreur lors de la suppression de l'image distante (${imageUrl}):`, error.message);
                }
            }
        }
        next();
    } catch (error) {
        console.error('Erreur dans le middleware pre(findOneAndDelete):', error);
        next(error);
    }
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
