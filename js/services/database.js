const DATABASE_NAME = "snaproom";
const DATABASE_VERSION = 1;

let databasePromise = null;

function openDatabase() {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) {
        reject(new Error("INDEXEDDB_UNAVAILABLE"));
        return;
      }
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("photos")) {
          db.createObjectStore("photos", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("projects")) {
          db.createObjectStore("projects", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("frames")) {
          db.createObjectStore("frames", { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return databasePromise;
}

function runStore(storeName, mode, operation) {
  return openDatabase().then((db) => new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let request;
    try {
      request = operation(store);
    } catch (error) {
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve(request?.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  }));
}

export async function putPhoto(photo) {
  return runStore("photos", "readwrite", (store) => store.put(photo));
}

export async function putProject(project) {
  return runStore("projects", "readwrite", (store) => store.put(project));
}

export async function getPhoto(photoId) {
  return runStore("photos", "readonly", (store) => store.get(photoId));
}

export async function getProject(projectId) {
  return runStore("projects", "readonly", (store) => store.get(projectId));
}

export async function getAllProjects() {
  return runStore("projects", "readonly", (store) => store.getAll());
}

export async function deletePhoto(photoId) {
  return runStore("photos", "readwrite", (store) => store.delete(photoId));
}

export async function deleteProject(projectId) {
  return runStore("projects", "readwrite", (store) => store.delete(projectId));
}

export async function getAllPhotos() {
  return runStore("photos", "readonly", (store) => store.getAll());
}

export async function clearAllData() {
  await runStore("photos", "readwrite", (store) => store.clear());
  await runStore("projects", "readwrite", (store) => store.clear());
  await runStore("frames", "readwrite", (store) => store.clear());
}
