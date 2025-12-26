export function closeModal(modal) {
    if (!modal.classList.contains('show')) return;

    modal.classList.add('closing');

    const content = modal.querySelector('.modal-content');
    const cleanup = () => {
        modal.classList.remove('show', 'closing');
        document.body.classList.remove('no-scroll');
        content.removeEventListener('animationend', cleanup);
    };

    content.addEventListener('animationend', cleanup, { once: true });
}

export function setupDragAndDrop(fileInput, fileLabel) {
    const dropZone = fileInput.parentElement;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-over');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            const file = files[0];
            if (file.name.endsWith('.json') || file.name.endsWith('.tgs')) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;

                const event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);
            }
        }
    }, false);
}

export function updateFileLabel(fileInput, labelElement, defaultText) {
    const dropZone = fileInput.parentElement;
    const dropSubtext = dropZone.querySelector('.drop-subtext');
    const uploadIcon = dropZone.querySelector('.upload-icon');

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        labelElement.textContent = file.name;
        dropZone.classList.add('active');

        const size = (file.size / 1024).toFixed(2) + ' KB';
        dropSubtext.textContent = size;

        uploadIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
    } else {
        labelElement.textContent = defaultText;
        dropZone.classList.remove('active');
        dropSubtext.textContent = 'or click to browse';

        uploadIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>';
    }
}
