const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;
let uploadedImages = []; // URLs des images uploadées

/**
 * Affiche les messages d'erreur dans le conteneur dédié.
 */
function displayError(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
                <p class="font-medium">${message}</p>
            </div>
        `;
    }
}

/**
 * Valide les fichiers sélectionnés.
 */
function validateFiles(files) {
    if (files.length > MAX_FILES) {
        throw new Error(`Vous pouvez ajouter un maximum de ${MAX_FILES} images.`);
    }

    for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
            throw new Error(`Le fichier "${file.name}" n'est pas valide. Utilisez JPG, PNG ou GIF.`);
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`Le fichier "${file.name}" est trop volumineux (max 5MB).`);
        }
    }
}

/**
 * Gère la prévisualisation des images sélectionnées.
 */
async function handleFileSelect(input) {
    const files = input.files;
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = ''; // Réinitialiser la prévisualisation
    displayError(''); // Effacer les messages d'erreur

    try {
        validateFiles(files); // Valider les fichiers

        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const div = document.createElement('div');
                div.className = 'relative group fade-in';
                div.innerHTML = `
                    <img src="${e.target.result}" class="w-full h-40 object-cover rounded-lg shadow-sm" alt="Image">
                    <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                        <button type="button" onclick="removeLocalImage(this)" class="text-white hover:text-red-500 p-2">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                `;
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    } catch (error) {
        console.error('Erreur:', error.message);
        displayError(error.message);
        input.value = ''; // Réinitialiser l'input si erreur
    }
}

/**
 * Supprime une image de la prévisualisation locale.
 */
function removeLocalImage(button) {
    const previewElement = button.closest('.group');
    if (previewElement) {
        previewElement.remove();
    }
}

// Ajouter les URLs des images au formulaire avant soumission
document.querySelector('form').addEventListener('submit', function (e) {
    const imagesInput = document.createElement('input');
    imagesInput.type = 'hidden';
    imagesInput.name = 'uploadedImages';
    imagesInput.value = JSON.stringify(uploadedImages);
    this.appendChild(imagesInput);
});

// Gestion du drag & drop
const dropZone = document.querySelector('#dropZone');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('border-blue-500', 'bg-blue-50'), false);
});

['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('border-blue-500', 'bg-blue-50'), false);
});

dropZone.addEventListener('drop', function (e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    document.getElementById('images').files = files; // Assign files to input
    handleFileSelect(document.getElementById('images'));
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
