// src/routes/blog.routes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const {
    getAllBlogs,
    getMyBlogs,
    getBlogById,
    renderNewBlogForm,
    createBlog,
    renderEditForm,
    updateBlog,
    deleteBlog,
    deleteImage
} = require('../controllers/blog.controller');
const upload = require('../middleware/upload.middleware');
const imageService = require('../services/image.service');

// Routes publiques
router.get('/', getAllBlogs);



// Routes protégées
router.get('/my', auth, getMyBlogs);
router.get('/new', auth, renderNewBlogForm);
router.post('/', auth, upload.single('image'), createBlog);
router.get('/edit/:id', auth, renderEditForm);
router.post('/edit/:id', auth, upload.single('image'), updateBlog);
router.delete('/:id', auth, deleteBlog);
router.delete('/:id/image/:imageIndex', auth, deleteImage);
router.get('/:id', getBlogById);

//Routes pour l'editPost
router.post('/upload-image', auth, upload.single('image'), async (req, res) => {
    try {
        const url = await imageService.uploadImage(req.file);
        res.json({ url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/remove-image', auth, async (req, res) => {
    try {
        const { url } = req.body;
        await imageService.deleteImage(url);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;