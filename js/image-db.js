/* =========================================
   IMAGE DATABASE - IndexedDB Helper
   ذخیره عکس‌ها به صورت جداگانه از LocalStorage
   ========================================= */

const ImageDB = (function() {
    const DB_NAME = 'AkbariSolutionImages';
    const DB_VERSION = 1;
    const STORE_NAME = 'productImages';

    let db = null;

    function openDB() {
        return new Promise((resolve, reject) => {
            if (db) return resolve(db);

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };

            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }

    async function saveImage(id, dataUrl) {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put({ id: id, data: dataUrl, createdAt: Date.now() });

            request.onsuccess = () => resolve(id);
            request.onerror = () => reject(request.error);
        });
    }

    async function getImage(id) {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result ? request.result.data : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async function deleteImage(id) {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async function getMultipleImages(ids) {
        const results = [];
        for (const id of ids) {
            const data = await getImage(id);
            if (data) results.push(data);
        }
        return results;
    }

    async function deleteMultipleImages(ids) {
        for (const id of ids) {
            await deleteImage(id);
        }
    }

    async function getAllImageIds() {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAllKeys();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function clearAll() {
        const database = await openDB();
        return new Promise((resolve, reject) => {
            const tx = database.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async function getStorageStats() {
        const ids = await getAllImageIds();
        let totalSize = 0;

        for (const id of ids) {
            const data = await getImage(id);
            if (data) totalSize += data.length;
        }

        return {
            count: ids.length,
            sizeBytes: totalSize,
            sizeMB: (totalSize / (1024 * 1024)).toFixed(2)
        };
    }

    return {
        saveImage,
        getImage,
        deleteImage,
        getMultipleImages,
        deleteMultipleImages,
        getAllImageIds,
        clearAll,
        getStorageStats
    };
})();

window.ImageDB = ImageDB;

console.log('✅ ImageDB loaded (IndexedDB)');