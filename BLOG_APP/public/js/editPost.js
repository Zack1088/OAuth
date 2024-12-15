// public/js/editPost.js

document.addEventListener('DOMContentLoaded', function () {
    const deleteModal = document.getElementById('deleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    const allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxFileSize = 5 * 1024 * 1024; // 5 MB

    let blogToDelete = null;

    // Fonction pour ouvrir la modale de suppression
    function openDeleteModal(blogId) {
        blogToDelete = blogId;
        deleteModal.classList.remove('hidden');
    }

    // Fonction pour fermer la modale
    function closeDeleteModal() {
        blogToDelete = null;
        deleteModal.classList.add('hidden');
    }

    // Suppression du blog
    async function deleteBlog(blogId) {
        try {
            const response = await fetch(`/blogs/${blogId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (data.success) {
                window.location.href = '/blogs/my';
            } else {
                alert(data.error || 'Une erreur est survenue lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
            alert('Une erreur est survenue lors de la suppression du blog');
        }
    }

    // Fonction pour supprimer une image
    window.deleteImage = async function (imageUrl, button) {
        try {
            const response = await fetch('/blogs/remove-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: imageUrl }),
            });

            const data = await response.json();

            if (data.success) {
                const container = button.closest('.image-preview');
                if (container) {
                    container.remove();
                }
            } else {
                alert(data.error || 'Erreur lors de la suppression de l\'image');
            }
        } catch (error) {
            console.error('Erreur suppression image:', error);
            alert('Une erreur est survenue lors de la suppression de l\'image');
        }
    };

    // Validation et prévisualisation des fichiers
    const imageInput = document.getElementById('images');
    imageInput.addEventListener('change', async function (e) {
        const files = Array.from(e.target.files);

        // Vérifier le type et la taille des fichiers
        for (const file of files) {
            if (!allowedFileTypes.includes(file.type)) {
                alert('Format non supporté. Veuillez utiliser JPG, PNG ou GIF.');
                return;
            }

            if (file.size > maxFileSize) {
                alert('Le fichier dépasse la taille maximale autorisée de 5MB.');
                return;
            }
        }

        const previewContainer = document.getElementById('imageGrid');

        for (const file of files) {
            try {
                // Ajouter un loader temporaire
                const preview = document.createElement('div');
                preview.className = 'image-preview relative group fade-in';
                preview.innerHTML = `
                    <div class="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                `;
                previewContainer.appendChild(preview);

                // Envoyer le fichier au backend
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch('/blogs/upload-image', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (data.url) {
                    // Mettre à jour l'aperçu
                    preview.innerHTML = `
                        <img src="${data.url}" 
                             class="w-full h-40 object-cover rounded-lg shadow-sm" 
                             alt="Image">
                        <div class="delete-overlay absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-lg">
                            <button type="button"
                                    class="delete-image-btn bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                                    onclick="deleteImage('${data.url}', this)">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        </div>
                    `;
                } else {
                    throw new Error(data.error || 'Erreur lors de l\'upload');
                }
            } catch (error) {
                console.error('Erreur upload:', error);
                alert('Une erreur est survenue lors de l\'upload de l\'image.');
            }
        }

        // Réinitialiser l'input après ajout
        e.target.value = '';
    });

    // Suppression du blog
    const deleteButton = document.querySelector('[data-action="delete"]');
    if (deleteButton) {
        deleteButton.addEventListener('click', function () {
            openDeleteModal(this.dataset.blogId);
        });
    }

    if (cancelDelete) {
        cancelDelete.addEventListener('click', closeDeleteModal);
    }

    if (confirmDelete) {
        confirmDelete.addEventListener('click', function () {
            if (blogToDelete) {
                deleteBlog(blogToDelete);
            }
        });
    }

    deleteModal.addEventListener('click', function (e) {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });

    // Ajout des URLs des images avant soumission
    const form = document.getElementById('editForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            const images = Array.from(document.querySelectorAll('.image-preview img'))
                .map(img => img.src);

            // Ajouter les URLs des images au formulaire
            const imagesInput = document.createElement('input');
            imagesInput.type = 'hidden';
            imagesInput.name = 'images';
            imagesInput.value = JSON.stringify(images);
            this.appendChild(imagesInput);
        });
    }
});
// Animation du toggle switch
const toggleCheckbox = document.querySelector('input[name="isPublic"]');
if (toggleCheckbox) {
    toggleCheckbox.addEventListener('change', function () {
        const dot = this.parentElement.querySelector('.dot');
        if (this.checked) {
            dot.style.transform = 'translateX(24px)';
            dot.style.backgroundColor = '#2563EB';
        } else {
            dot.style.transform = 'translateX(0)';
            dot.style.backgroundColor = '#fff';
        }
    });
}