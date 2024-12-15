// services/image.service.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class ImageService {
    constructor() {
        this.baseURL = process.env.IMAGE_SERVER_URL || 'http://localhost:4000';
        this.clientId = process.env.IMAGE_CLIENT_ID;
        this.clientSecret = process.env.IMAGE_CLIENT_SECRET;

        if (!this.clientId || !this.clientSecret) {
            console.warn('⚠️ IMAGE_CLIENT_ID ou IMAGE_CLIENT_SECRET non configurés');
        }
    }

    async getToken() {
        try {
            const response = await axios.post(`${this.baseURL}/oauth/token`, {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'client_credentials'
            });
            return response.data.data.access_token;
        } catch (error) {
            console.error('Erreur obtention token:', error);
            throw new Error('Erreur d\'authentification avec le serveur d\'images');
        }
    }

    async uploadImage(file) {
        try {
            const token = await this.getToken();
            const formData = new FormData();

            if (!fs.existsSync(file.path)) {
                throw new Error('Fichier non trouvé');
            }

            const fileStream = fs.createReadStream(file.path);
            formData.append('image', fileStream, {
                filename: file.originalname,
                contentType: file.mimetype
            });

            const response = await axios.post(
                `${this.baseURL}/api/images/upload`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Bearer ${token}`
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );

            try {
                await fs.promises.unlink(file.path);
            } catch (unlinkError) {
                console.warn('Erreur suppression fichier temporaire:', unlinkError);
            }

            return response.data.data.url;
        } catch (error) {
            console.error('Erreur upload image:', error);
            if (file.path) {
                try {
                    await fs.promises.unlink(file.path);
                } catch (unlinkError) {
                    console.warn('Erreur suppression fichier temporaire:', unlinkError);
                }
            }
            throw new Error('Erreur lors de l\'upload de l\'image');
        }
    }

    async deleteImage(imageUrl) {
        try {
            const token = await this.getToken();
            const filename = imageUrl.split('/').pop();

            await axios.delete(
                `${this.baseURL}/api/images/${filename}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            return true;
        } catch (error) {
            console.error('Erreur suppression image:', error);
            return false;
        }
    }

    async getImageInfo(imageUrl) {
        try {
            const token = await this.getToken();
            const filename = imageUrl.split('/').pop();

            const response = await axios.get(
                `${this.baseURL}/api/images/${filename}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            return response.data.data;
        } catch (error) {
            console.error('Erreur récupération info image:', error);
            return null;
        }
    }
}

const imageService = new ImageService();
module.exports = imageService;