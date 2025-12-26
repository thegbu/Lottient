import { readFileAsJson, downloadBlob, downloadFile } from './modules/utils.js';
import { renameGradientsRecursively, extractGradientsByName, getRestorableList, applyGradientsByName } from './modules/lottie-core.js';
import { AnimationController } from './modules/animation-player.js';
import { closeModal, setupDragAndDrop, updateFileLabel } from './modules/ui-utils.js';

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
    playPauseBtn: document.getElementById('playPauseBtn'),
    frameSlider: document.getElementById('frameSlider'),
    frameInput: document.getElementById('frameInput'),
    frameTotalLabel: document.getElementById('frameTotalLabel'),
};

let step1ResultData = null;
let step1BaseName = 'renamed_lottie';
let modifiedLottieData = null;

let step2BaseName = 'fixed';
let rawStep2LottieData = null;
let loadedReferenceGradients = null;
let animController = null;

document.addEventListener('DOMContentLoaded', () => {
    updateStep2State();

    animController = new AnimationController('anim');
    setupPlayerControls();
});
elements.customReferenceCheckbox.addEventListener('change', updateStep2State);
elements.renameButton.addEventListener('click', handleRename);
elements.restoreButton.addEventListener('click', handleRestore);

elements.downloadLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (step1ResultData) {
        const blob = new Blob([JSON.stringify(step1ResultData)], { type: 'application/json' });
        downloadBlob(blob, `${step1BaseName}_renamed.json`);
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
    closeModal(elements.formatModal);
});

window.addEventListener('click', (event) => {
    if (event.target === elements.formatModal) {
        closeModal(elements.formatModal);
    }
});

elements.downloadJsonButton.addEventListener('click', () => {
    downloadFile(modifiedLottieData, `${step2BaseName}_fixed.json`, 'json');
    closeModal(elements.formatModal);
});

elements.downloadTgsButton.addEventListener('click', () => {
    downloadFile(modifiedLottieData, `${step2BaseName}_fixed.tgs`, 'tgs');
    closeModal(elements.formatModal);
});

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
        const originalName = fileInput.files[0].name;
        step1BaseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;

        const processingData = structuredClone(data);
        const usedNames = new Set();
        const counters = { gf: 0, gs: 0 };

        renameGradientsRecursively(processingData, usedNames, counters);
        step1ResultData = processingData;
        customReferenceCheckbox.checked = false;

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
        const originalName = lottieFileInput.files[0].name;
        step2BaseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;

        const referenceData = customReferenceCheckbox.checked
            ? await readFileAsJson(referenceFileInput.files[0])
            : step1ResultData;

        if (!referenceData) {
            restoreResultDiv.textContent = 'Please complete Step 1 first or check "Use custom reference file".';
            return;
        }

        rawStep2LottieData = lottieData;
        loadedReferenceGradients = extractGradientsByName(referenceData);

        const restorableNames = getRestorableList(rawStep2LottieData, loadedReferenceGradients);

        let listHtml = `
        <div class="gradient-list-container">
            <div class="gradient-list-header">
                <h3>Restorations</h3>
                <div class="select-all-container">
                    <input type="checkbox" id="selectAllGradients" checked onchange="toggleSelectAll(this)">
                    <label for="selectAllGradients" style="cursor:pointer;">Select All</label>
                </div>
            </div>
            <div class="gradient-list">
    `;

        if (restorableNames.length === 0) {
            listHtml += '<div class="gradient-item"><span style="color:#999;font-size:0.9rem;">No matching gradients found.</span></div>';
        } else {
            restorableNames.forEach(name => {
                listHtml += `
            <div class="gradient-item">
                <input type="checkbox" class="grad-checkbox" id="grad-${name}" value="${name}" checked onchange="updateRestoredOutput()">
                <label for="grad-${name}">${name}</label>
            </div>`;
            });
        }
        listHtml += '</div></div>';

        restoreResultDiv.innerHTML = `
      <div class="result-card">
        <div class="result-header">
          <svg style="width: 24px; height: 24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          Restoration Complete!
        </div>
        
        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-value" id="stat-gf">0</span>
            <span class="stat-label">Fills</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" id="stat-gs">0</span>
            <span class="stat-label">Strokes</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" id="stat-total">0</span>
            <span class="stat-label">Restored</span>
          </div>
        </div>

        ${listHtml}

        <div class="result-actions" id="step2Actions">
          <!-- Download button will be moved here -->
        </div>
      </div>
    `;

        const actionsContainer = document.getElementById('step2Actions');
        restoreDownloadLink.textContent = 'Download Fixed File';
        restoreDownloadLink.style.display = 'inline-block';
        actionsContainer.appendChild(restoreDownloadLink);

        updateRestoredOutput();

    } catch (error) {
        restoreResultDiv.textContent = `Error: ${error.message}`;
    }
}

window.toggleSelectAll = function (selectAllCheckbox) {
    const checkboxes = document.querySelectorAll('.gradient-list .grad-checkbox');
    checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
    updateRestoredOutput();
}

window.updateRestoredOutput = function () {
    if (!rawStep2LottieData || !loadedReferenceGradients) return;

    const checkedBoxes = document.querySelectorAll('.gradient-list .grad-checkbox:checked');
    const allowedNames = new Set(Array.from(checkedBoxes).map(cb => cb.value));

    const allBoxes = document.querySelectorAll('.gradient-list .grad-checkbox');
    const selectAllCheckbox = document.getElementById('selectAllGradients');
    if (selectAllCheckbox && allBoxes.length > 0) {
        selectAllCheckbox.checked = checkedBoxes.length === allBoxes.length;
        selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < allBoxes.length;
    }

    const counters = { gf: 0, gs: 0 };
    modifiedLottieData = applyGradientsByName(rawStep2LottieData, loadedReferenceGradients, counters, allowedNames);

    document.getElementById('stat-gf').textContent = counters.gf;
    document.getElementById('stat-gs').textContent = counters.gs;
    document.getElementById('stat-total').textContent = counters.gf + counters.gs;

    if (animController) {
        const wasPaused = animController.anim ? animController.anim.isPaused : false;
        const currentFrame = animController.anim ? animController.anim.currentFrame : 0;

        animController.loadAnimation(
            modifiedLottieData,
            (totalFrames) => {
                const { frameSlider, frameInput, frameTotalLabel, playPauseBtn } = elements;
                frameSlider.max = totalFrames - 1;
                frameInput.max = totalFrames - 1;
                frameTotalLabel.textContent = `/ ${Math.round(totalFrames - 1)}`;

            },
            (currentFrame) => {
                const { frameSlider, frameInput } = elements;
                if (document.activeElement !== frameSlider && document.activeElement !== frameInput) {
                    frameSlider.value = currentFrame;
                    frameInput.value = Math.round(currentFrame);
                }
            }
        );

        if (wasPaused) {
            animController.goToFrame(currentFrame, true);
            elements.playPauseBtn.textContent = "Play";
        } else {
            animController.goToFrame(currentFrame, false);
            elements.playPauseBtn.textContent = "Pause";
        }
    }
}

function setupPlayerControls() {
    const { playPauseBtn, frameSlider, frameInput } = elements;

    playPauseBtn.addEventListener('click', () => {
        if (!animController) return;
        const isPaused = animController.togglePlay();
        playPauseBtn.textContent = isPaused ? "Play" : "Pause";
    });

    frameSlider.addEventListener('input', () => {
        if (!animController) return;
        const frame = parseFloat(frameSlider.value);
        animController.pause();
        animController.goToFrame(frame, true);
        playPauseBtn.textContent = "Play";
        frameInput.value = Math.round(frame);
    });

    frameInput.addEventListener('input', () => {
        if (!animController) return;
        const frame = parseInt(frameInput.value);
        if (!isNaN(frame) && frame >= 0 && frame <= frameSlider.max) {
            animController.pause();
            animController.goToFrame(frame, true);
            frameSlider.value = frame;
            playPauseBtn.textContent = "Play";
        }
    });
}
