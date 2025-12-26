export async function readFileAsJson(file) {
    if (file.name.toLowerCase().endsWith('.tgs')) {
        const buffer = await file.arrayBuffer();
        const decompressed = window.pako.ungzip(new Uint8Array(buffer), { to: 'string' });
        return JSON.parse(decompressed);
    } else {
        const text = await file.text();
        return JSON.parse(text);
    }
}

export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function downloadFile(data, filename, format) {
    let blob;
    if (format === 'tgs') {
        const jsonString = JSON.stringify(data);
        const compressed = window.pako.gzip(jsonString);
        blob = new Blob([compressed], { type: 'application/octet-stream' });
    } else {
        blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    }

    downloadBlob(blob, filename);
}

export function generateUniqueName(existingNames, prefix, length = 10) {
    let name;
    do {
        name = `${prefix}${Math.random().toString(36).substring(2, 2 + length)}`;
    } while (existingNames.has(name));
    existingNames.add(name);
    return name;
}
