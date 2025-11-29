const elements = {
  fileInput: document.getElementById('fileInput'),
  fileInputLabel: document.getElementById('fileInput-label'),
  renameButton: document.getElementById('renameButton'),
  resultDiv: document.getElementById('result'),
  downloadLink: document.getElementById('downloadLink'),
  customReferenceCheckbox: document.getElementById('customReferenceCheckbox'),
  referenceFileInputContainer: document.getElementById('referenceFileInputContainer'),
  referenceFileInput: document.getElementById('referenceFileInput'),
  referenceFileInputLabel: document.getElementById('referenceFileInput-label'),
  lottieFileInput: document.getElementById('lottieFileInput'),
  lottieFileInputLabel: document.getElementById('lottieFileInput-label'),
  restoreButton: document.getElementById('restoreButton'),
  restoreResultDiv: document.getElementById('restoreResult'),
  restoreDownloadLink: document.getElementById('restoreDownloadLink'),
  formatModal: document.getElementById('formatModal'),
  closeButton: document.querySelector('.close-button'),
  downloadJsonButton: document.getElementById('downloadJsonButton'),
  downloadTgsButton: document.getElementById('downloadTgsButton'),
};

let step1ResultData = null;
let modifiedLottieData = null;

document.addEventListener('DOMContentLoaded', updateStep2State);
elements.customReferenceCheckbox.addEventListener('change', updateStep2State);
elements.renameButton.addEventListener('click', handleRename);
elements.restoreButton.addEventListener('click', handleRestore);

elements.downloadLink.addEventListener('click', (e) => {
  e.preventDefault();
  if (step1ResultData) {
    const blob = new Blob([JSON.stringify(step1ResultData)], { type: 'application/json' });
    downloadBlob(blob, 'renamed_lottie.json');
  }
});

elements.fileInput.addEventListener('change', () => {
  updateFileLabel(elements.fileInput, elements.fileInputLabel, 'Drag & Drop your file here');
});

elements.referenceFileInput.addEventListener('change', () => {
  updateFileLabel(elements.referenceFileInput, elements.referenceFileInputLabel, 'Drag & Drop your file here');
});

elements.lottieFileInput.addEventListener('change', () => {
  updateFileLabel(elements.lottieFileInput, elements.lottieFileInputLabel, 'Drag & Drop your file here');
});

setupDragAndDrop(elements.fileInput, elements.fileInputLabel);
setupDragAndDrop(elements.referenceFileInput, elements.referenceFileInputLabel);
setupDragAndDrop(elements.lottieFileInput, elements.lottieFileInputLabel);

elements.restoreDownloadLink.addEventListener('click', (e) => {
  e.preventDefault();
  if (modifiedLottieData) {
    elements.formatModal.classList.add('show');
    document.body.classList.add('no-scroll');
  }
});

elements.closeButton.addEventListener('click', () => {
  elements.formatModal.classList.remove('show');
  document.body.classList.remove('no-scroll');
});

window.addEventListener('click', (event) => {
  if (event.target === elements.formatModal) {
    elements.formatModal.classList.remove('show');
    document.body.classList.remove('no-scroll');
  }
});

elements.downloadJsonButton.addEventListener('click', () => {
  downloadFile(modifiedLottieData, 'fixed.json', 'json');
  elements.formatModal.classList.remove('show');
  document.body.classList.remove('no-scroll');
});

elements.downloadTgsButton.addEventListener('click', () => {
  downloadFile(modifiedLottieData, 'fixed.tgs', 'tgs');
  elements.formatModal.classList.remove('show');
  document.body.classList.remove('no-scroll');
});

function setupDragAndDrop(fileInput, fileLabel) {
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

function updateFileLabel(fileInput, labelElement, defaultText) {
  const dropZone = fileInput.parentElement;
  const dropSubtext = dropZone.querySelector('.drop-subtext');
  const uploadIcon = dropZone.querySelector('.upload-icon');

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    labelElement.textContent = file.name;
    dropZone.classList.add('active');

    // Update subtext with file size
    const size = (file.size / 1024).toFixed(2) + ' KB';
    dropSubtext.textContent = size;

    // Change icon to checkmark
    uploadIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
  } else {
    labelElement.textContent = defaultText;
    dropZone.classList.remove('active');
    dropSubtext.textContent = 'or click to browse';

    // Reset icon
    uploadIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>';
  }
}

function updateStep2State() {
  const { customReferenceCheckbox, referenceFileInputContainer } = elements;
  if (step1ResultData) {
    customReferenceCheckbox.disabled = false;
    referenceFileInputContainer.style.display = customReferenceCheckbox.checked ? 'block' : 'none';
  } else {
    customReferenceCheckbox.checked = true;
    customReferenceCheckbox.disabled = true;
    referenceFileInputContainer.style.display = 'block';
  }
}

async function handleRename() {
  const { fileInput, resultDiv, downloadLink, customReferenceCheckbox } = elements;
  if (fileInput.files.length === 0) {
    resultDiv.textContent = 'Please select a file first.';
    return;
  }

  try {
    const data = await readFileAsJson(fileInput.files[0]);
    const processingData = structuredClone(data);
    const usedNames = new Set();
    const counters = { gf: 0, gs: 0 };

    renameGradientsRecursively(processingData, usedNames, counters);
    step1ResultData = processingData;
    customReferenceCheckbox.checked = false;

    // Create Result Card HTML
    resultDiv.innerHTML = `
      <div class="result-card">
        <div class="result-header">
          <svg style="width: 24px; height: 24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          Renaming Complete!
        </div>
        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-value">${counters.gf}</span>
            <span class="stat-label">Fills</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${counters.gs}</span>
            <span class="stat-label">Strokes</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${counters.gf + counters.gs}</span>
            <span class="stat-label">Total</span>
          </div>
        </div>
        <p style="margin: 0 0 20px; font-size: 0.9rem; color: var(--color-text-medium); line-height: 1.5; text-align: left;">
          Download the renamed file, go to After Effects, and using the 
          <strong style="color: var(--color-text-dark);">Bodymovin extension</strong>, import it to make your changes.<br>
          <strong style="color: var(--color-text-dark);">Once finished</strong>, export as a new <strong>.json</strong> or <strong>.tgs</strong> file, then proceed to Step 2.
        </p>
        <div class="result-actions" id="step1Actions">
          <!-- Download button will be moved here -->
        </div>
      </div>
    `;

    // Move download button into the card
    const actionsContainer = document.getElementById('step1Actions');
    downloadLink.textContent = 'Download Renamed JSON';
    downloadLink.style.display = 'inline-block';
    actionsContainer.appendChild(downloadLink);

    updateStep2State();
  } catch (error) {
    resultDiv.textContent = `Error: ${error.message}`;
  }
}

async function handleRestore() {
  const { lottieFileInput, referenceFileInput, customReferenceCheckbox, restoreResultDiv, restoreDownloadLink } = elements;

  if (lottieFileInput.files.length === 0) {
    restoreResultDiv.textContent = 'Please select a Lottie file to restore.';
    return;
  }

  try {
    const lottieData = await readFileAsJson(lottieFileInput.files[0]);
    const referenceData = customReferenceCheckbox.checked
      ? await readFileAsJson(referenceFileInput.files[0])
      : step1ResultData;

    if (!referenceData) {
      restoreResultDiv.textContent = 'Please complete Step 1 first or check "Use custom reference file".';
      return;
    }

    const counters = { gf: 0, gs: 0 };
    const modified = applyGradientsByName(lottieData, extractGradientsByName(referenceData), counters);
    modifiedLottieData = modified;

    // Create Result Card HTML
    restoreResultDiv.innerHTML = `
      <div class="result-card">
        <div class="result-header">
          <svg style="width: 24px; height: 24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          Restoration Complete!
        </div>
        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-value">${counters.gf}</span>
            <span class="stat-label">Fills</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${counters.gs}</span>
            <span class="stat-label">Strokes</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${counters.gf + counters.gs}</span>
            <span class="stat-label">Restored</span>
          </div>
        </div>
        <div class="result-actions" id="step2Actions">
          <!-- Download button will be moved here -->
        </div>
      </div>
    `;

    // Move download button into the card
    const actionsContainer = document.getElementById('step2Actions');
    restoreDownloadLink.textContent = 'Download Fixed File';
    restoreDownloadLink.style.display = 'inline-block';
    actionsContainer.appendChild(restoreDownloadLink);

  } catch (error) {
    restoreResultDiv.textContent = `Error: ${error.message}`;
  }
}

async function readFileAsJson(file) {
  if (file.name.toLowerCase().endsWith('.tgs')) {
    const buffer = await file.arrayBuffer();
    const decompressed = pako.ungzip(new Uint8Array(buffer), { to: 'string' });
    return JSON.parse(decompressed);
  } else {
    const text = await file.text();
    return JSON.parse(text);
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadFile(data, filename, format) {
  let blob;
  if (format === 'tgs') {
    const jsonString = JSON.stringify(data);
    const compressed = pako.gzip(jsonString);
    blob = new Blob([compressed], { type: 'application/octet-stream' });
  } else {
    blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  }

  downloadBlob(blob, filename);
}

function renameGradientsRecursively(obj, usedNames, counters) {
  if (Array.isArray(obj)) {
    obj.forEach(item => renameGradientsRecursively(item, usedNames, counters));
  } else if (typeof obj === 'object' && obj !== null) {
    if (obj.ty === 'gf' || obj.ty === 'gs') {
      const prefix = obj.ty === 'gf' ? 'Gradient_Fill_' : 'Gradient_Stroke_';
      obj.nm = generateUniqueName(usedNames, prefix);
      counters[obj.ty]++;
    }
    Object.values(obj).forEach(value => renameGradientsRecursively(value, usedNames, counters));
  }
}

function generateUniqueName(existingNames, prefix, length = 10) {
  let name;
  do {
    name = `${prefix}${Math.random().toString(36).substring(2, 2 + length)}`;
  } while (existingNames.has(name));
  existingNames.add(name);
  return name;
}

function extractGradientsByName(obj) {
  const gradients = {};
  const targetTypes = new Set(['gf', 'gs']);

  function scan(item) {
    if (Array.isArray(item)) {
      item.forEach(scan);
    } else if (typeof item === 'object' && item !== null) {
      if (targetTypes.has(item.ty) && item.nm && item.g) {
        gradients[item.nm] = { p: item.g.p, k: item.g.k };
      }
      Object.values(item).forEach(scan);
    }
  }

  scan(obj);
  return gradients;
}

function applyGradientsByName(obj, referenceGradients, counters) {
  const targetTypes = new Set(['gf', 'gs']);
  const newObj = structuredClone(obj);

  function scan(item) {
    if (Array.isArray(item)) {
      item.forEach(scan);
    } else if (typeof item === 'object' && item !== null) {
      if (targetTypes.has(item.ty) && referenceGradients[item.nm]) {
        const ref = referenceGradients[item.nm];
        item.g.p = ref.p;
        item.g.k = ref.k;
        counters[item.ty]++;
      }
      Object.values(item).forEach(scan);
    }
  }

  scan(newObj);
  return newObj;
}