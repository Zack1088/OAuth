// src/controllers/blog.controller.js
const Blog = require('../models/blog.model');
const fs = require('fs').promises;
const path = require('path');
const imageService = require('../services/image.service');

const getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ isPublic: true })
            .populate('author', 'email') 
            .sort('-createdAt'); 

        console.log('Blogs récupérés:', blogs); 

        res.render('blogs/index', {
            title: 'Blogs publics',
            blogs
        });
    } catch (error) {
        console.error('Erreur getAllBlogs:', error);
        req.flash('error', 'Erreur lors de la récupération des blogs');
        res.redirect('/');
    }
};


const getMyBlogs = async (req, res) => {
    try {
        console.log('User ID:', req.user._id);
        const blogs = await Blog.find({ author: req.user._id })
            .populate('author', 'email')
            .sort('-createdAt');

        console.log('Blogs:', blogs);

        res.render('blogs/my-blogs', {
            title: 'Mes Posts',
            blogs
        });
    } catch (error) {
        console.error('Erreur getMyBlogs:', error);
        req.flash('error', 'Erreur lors de la récupération de vos blogs');
        res.redirect('/');
    }
};

const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate('author', 'email');

        if (!blog) {
            req.flash('error', 'Blog non trouvé');
            return res.redirect('/blogs');
        }

        if (!blog.isPublic && (!req.user || blog.author._id.toString() !== req.user._id.toString())) {
            req.flash('error', 'Accès non autorisé');
            return res.redirect('/blogs');
        }

        res.render('blogs/show', {
            title: blog.title,
            blog
        });
    } catch (error) {
        console.error('Erreur getBlogById:', error);
        req.flash('error', 'Erreur lors de la récupération du blog');
        res.redirect('/blogs');
    }
};

const renderNewBlogForm = (req, res) => {
    res.render('blogs/new', {
        title: 'Créer un nouveau post',
        error: null
    });
};

const createBlog = async (req, res) => {
    try {
        console.log('Body:', req.body);
        console.log('File:', req.file);

        const { title, content, isPublic } = req.body;

        if (!title || !content) {
            req.flash('error', 'Le titre et le contenu sont requis');
            return res.redirect('/blogs/new');
        }

        // Upload de l'image vers le serveur d'images
        let imageUrl = null;
        if (req.file) {
            try {
                imageUrl = await imageService.uploadImage(req.file);
            } catch (uploadError) {
                console.error('Erreur upload image:', uploadError);
                req.flash('error', 'Erreur lors de l\'upload de l\'image');
                return res.redirect('/blogs/new');
            }
        }

        const blog = new Blog({
            title,
            content,
            author: req.user._id,
            isPublic: isPublic === 'true' || isPublic === 'on',
            images: imageUrl ? [imageUrl] : []
        });

        await blog.save();
        req.flash('success', 'Blog créé avec succès');
        res.redirect('/blogs/my');
    } catch (error) {
        console.error('Erreur création blog:', error);
        req.flash('error', 'Erreur lors de la création du blog');
        res.redirect('/blogs/new');
    }
};

const renderEditForm = async (req, res) => {
    try {
        const blog = await Blog.findOne({
            _id: req.params.id,
            author: req.user._id
        }).populate('author', 'email');

        if (!blog) {
            req.flash('error', 'Blog non trouvé');
            return res.redirect('/blogs/my');
        }

        res.render('blogs/edit', {
            title: 'Modifier le blog',
            blog,
            error: null
        });
    } catch (error) {
        console.error('Erreur renderEditForm:', error);
        req.flash('error', 'Erreur lors de la récupération du blog');
        res.redirect('/blogs/my');
    }
};

// Mise à jour du post
const updateBlog = async (req, res) => {
    try {
        console.log('Body reçu:', req.body);
        const { title, content, isPublic } = req.body;

        // Rechercher le blog à mettre à jour
        const blog = await Blog.findOne({
            _id: req.params.id,
            author: req.user._id
        });

        if (!blog) {
            req.flash('error', 'Blog non trouvé.');
            return res.redirect('/blogs/my');
        }

        // Mise à jour des champs texte
        blog.title = title;
        blog.content = content;
        blog.isPublic = isPublic === 'true' || isPublic === 'on';

        // Gestion des images
        let images = blog.images || []; 
        
        // Si une nouvelle image est uploadée
        if (req.file) {
            try {
                const imageUrl = await imageService.uploadImage(req.file);
                images.push(imageUrl);
            } catch (uploadError) {
                console.error('Erreur upload image:', uploadError);
                req.flash('error', 'Erreur lors de l\'upload de l\'image');
                return res.redirect(`/blogs/edit/${req.params.id}`);
            }
        }

        // Si des images ont été envoyées via le formulaire
        if (req.body.images) {
            try {
                const parsedImages = JSON.parse(req.body.images);
                images = parsedImages;
            } catch (parseError) {
                console.error('Erreur parsing images:', parseError);
            }
        }

        // Mise à jour des images
        blog.images = images;
        await blog.save();

        req.flash('success', 'Blog mis à jour avec succès.');
        res.redirect('/blogs/my');
    } catch (error) {
        console.error('Erreur updateBlog:', error);
        req.flash('error', 'Erreur lors de la mise à jour du blog.');
        res.redirect(`/blogs/edit/${req.params.id}`);
    }
};

const deleteBlog = async (req, res) => {
    try {
        console.log('ID du blog à supprimer:', req.params.id);
        console.log('ID de l\'utilisateur:', req.user._id);

        // Trouver le blog à supprimer
        const blog = await Blog.findOneAndDelete({
            _id: req.params.id,
            author: req.user._id
        });

        if (!blog) {
            return res.status(404).json({
                success: false,
                error: 'Blog non trouvé'
            });
        }

        console.log('Blog trouvé:', blog);

        // Supprimer les images associées sur le serveur distant
        if (blog.images && blog.images.length > 0) {
            const imageService = require('../services/image.service'); 
            for (const imageUrl of blog.images) {
                try {
                    await imageService.deleteImage(imageUrl);
                } catch (error) {
                    console.error(`Erreur lors de la suppression de l'image distante (${imageUrl}):`, error.message);
                }
            }
        }

        res.json({
            success: true,
            message: 'Blog supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur deleteBlog:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression du blog'
        });
    }
};

const deleteImage = async (req, res) => {
    try {
        const { id: blogId, imageIndex } = req.params;

        const blog = await Blog.findById(blogId);

        if (!blog) {
            return res.status(404).json({
                success: false,
                error: 'Blog non trouvé',
            });
        }

        const index = parseInt(imageIndex, 10);
        if (isNaN(index) || index < 0 || index >= blog.images.length) {
            return res.status(400).json({
                success: false,
                error: 'Index de l\'image invalide',
            });
        }

        // Récupérer l'URL de l'image à supprimer
        const [removedImageUrl] = blog.images.splice(index, 1);

        // Mettre à jour directement le document
        await Blog.findByIdAndUpdate(
            blogId,
            { images: blog.images },
            { new: true }
        );

        // Supprimer l'image sur le serveur distant
        const imageService = require('../services/image.service');
        await imageService.deleteImage(removedImageUrl);

        res.json({
            success: true,
            message: 'Image supprimée avec succès',
        });
    } catch (error) {
        console.error('Erreur deleteImage:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression de l\'image',
        });
    }
};

module.exports = {
    getAllBlogs,
    getMyBlogs,
    getBlogById,
    renderNewBlogForm,
    createBlog,
    renderEditForm,
    updateBlog,
    deleteBlog,
    deleteImage
};
