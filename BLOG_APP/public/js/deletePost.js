document.addEventListener('DOMContentLoaded', function() {
    const deleteModal = document.getElementById('deleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');
    
    if (!deleteModal) return;
    
    let blogToDelete = null;
    
    function getCurrentPage() {
        const path = window.location.pathname;
        if (path === '/blogs/my') return 'list';
        if (path.includes('/blogs/edit/')) return 'edit';
        return 'detail';
    }

    // Fonction pour ouvrir la modale
    function openDeleteModal(blogId) {
        blogToDelete = blogId;
        deleteModal.classList.remove('hidden');
    }

    // Fonction pour fermer la modale
    function closeDeleteModal() {
        blogToDelete = null;
        deleteModal.classList.add('hidden');
    }

    // Gérer la suppression selon la page
    async function deleteBlog(blogId) {
        try {
            const response = await fetch(`/blogs/${blogId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                const currentPage = getCurrentPage();
                
                switch(currentPage) {
                    case 'list':
                        // Dans la liste, on supprime juste l'élément du DOM
                        const blogElement = document.querySelector(`[data-blog-id="${blogId}"]`);
                        if (blogElement) {
                            blogElement.remove();
                        }
                        break;
                    case 'edit':
                    case 'detail':
                        // Dans la vue détail ou édition, on redirige
                        window.location.href = '/blogs/my';
                        break;
                }
                closeDeleteModal();
            } else {
                alert(data.error || 'Une erreur est survenue');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Une erreur est survenue lors de la suppression');
        }
    }

    // Event listeners pour les boutons de suppression
    document.querySelectorAll('[data-action="delete"]').forEach(button => {
        button.addEventListener('click', function() {
            const blogId = this.dataset.blogId;
            openDeleteModal(blogId);
        });
    });

    // Event listeners pour la modale
    if (cancelDelete) {
        cancelDelete.addEventListener('click', closeDeleteModal);
    }

    if (confirmDelete) {
        confirmDelete.addEventListener('click', function() {
            if (blogToDelete) {
                deleteBlog(blogToDelete);
            }
        });
    }

    // Fermer la modale si on clique en dehors
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
      // Gestion de la suppression des images
      async function deleteImage(imageId) {
        try {
            const response = await fetch(`/blogs/image/${imageId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.success) {
                const imageElement = document.querySelector(`[data-image-id="${imageId}"]`);
                if (imageElement) {
                    imageElement.remove();
                }
            } else {
                alert(data.error || 'Une erreur est survenue lors de la suppression de l\'image');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Une erreur est survenue lors de la suppression de l\'image');
        }
    }

    // Event listeners pour les boutons de suppression d'images
    document.querySelectorAll('.delete-image-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const imageId = this.closest('.image-preview').dataset.imageId;
            if (confirm('Voulez-vous vraiment supprimer cette image ?')) {
                deleteImage(imageId);
            }
        });
    });

    // Prévisualisation des images
    const imageInput = document.getElementById('images');
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            const imageGrid = document.getElementById('imageGrid');
            
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const preview = document.createElement('div');
                        preview.className = 'image-preview relative group';
                        preview.innerHTML = `
                            <img src="${e.target.result}" 
                                 class="w-full h-40 object-cover rounded-lg shadow-sm" 
                                 alt="Prévisualisation">
                            <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
                                <span class="text-white text-sm">Nouvelle image</span>
                            </div>`;
                        imageGrid.appendChild(preview);
                    }
                    reader.readAsDataURL(file);
                }
            });
        });
    }
});
