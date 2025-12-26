import { generateUniqueName } from './utils.js';

export function renameGradientsRecursively(obj, usedNames, counters) {
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

export function extractGradientsByName(obj) {
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

export function getRestorableList(obj, referenceGradients) {
    const list = [];
    const targetTypes = new Set(['gf', 'gs']);
    function scan(item) {
        if (Array.isArray(item)) item.forEach(scan);
        else if (typeof item === 'object' && item !== null) {
            if (targetTypes.has(item.ty) && referenceGradients[item.nm]) {
                list.push(item.nm);
            }
            Object.values(item).forEach(scan);
        }
    }
    scan(obj);
    return [...new Set(list)];
}

export function applyGradientsByName(obj, referenceGradients, counters, allowedNames = null) {
    const targetTypes = new Set(['gf', 'gs']);
    const newObj = structuredClone(obj);

    function scan(item) {
        if (Array.isArray(item)) {
            item.forEach(scan);
        } else if (typeof item === 'object' && item !== null) {
            if (targetTypes.has(item.ty) && referenceGradients[item.nm]) {
                if (allowedNames === null || allowedNames.has(item.nm)) {
                    const ref = referenceGradients[item.nm];
                    item.g.p = ref.p;
                    item.g.k = ref.k;
                    counters[item.ty]++;
                }
            }
            Object.values(item).forEach(scan);
        }
    }

    scan(newObj);
    return newObj;
}
