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
    updateFileLabel(elements.fileInput, elements.fileInputLabel, 'Choose File');
});

elements.referenceFileInput.addEventListener('change', () => {
    updateFileLabel(elements.referenceFileInput, elements.referenceFileInputLabel, 'Choose File');
});

elements.lottieFileInput.addEventListener('change', () => {
    updateFileLabel(elements.lottieFileInput, elements.lottieFileInputLabel, 'Choose File');
});

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

function updateFileLabel(fileInput, labelElement, defaultText) {
    if (fileInput.files.length > 0) {
        labelElement.textContent = fileInput.files[0].name;
    } else {
        labelElement.textContent = defaultText;
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

    resultDiv.innerHTML = `
      <p>✅ Renaming complete: ${counters.gf + counters.gs} gradients processed.</p>
      <p class="result-detail">&nbsp;&nbsp;└ Gradient Fills (gf): ${counters.gf}</p>
      <p class="result-detail">&nbsp;&nbsp;└ Gradient Strokes (gs): ${counters.gs}</p>
      <hr style="border: 0; border-top: 1px dashed var(--color-border); margin: 1.5rem 0 1rem;">
      <p style="font-size: 0.95rem; color: var(--color-text-dark); font-weight: 500; margin: 0; line-height: 1.4;">
        Download the renamed file, go to After Effects, and using the 
        <strong>Bodymovin extension</strong>, import the renamed file into Adobe After Effects and make any changes you want to it.<br>
        <strong>Once finished</strong>, export your project as a new <strong>.json</strong> or <strong>.tgs</strong> file, and then proceed to Step 2.
      </p>
    `;


    downloadLink.textContent = 'Download Renamed JSON';
    downloadLink.style.display = 'inline-block';

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

    restoreResultDiv.innerHTML = `
      <p>✅ Successfully restored ${counters.gf + counters.gs} gradients!</p>
      <p class="result-detail">&nbsp;&nbsp;└ Gradient Fills (gf): ${counters.gf}</p>
      <p class="result-detail">&nbsp;&nbsp;└ Gradient Strokes (gs): ${counters.gs}</p>
    `;

    restoreDownloadLink.textContent = 'Download Fixed File';
    restoreDownloadLink.style.display = 'inline-block';

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