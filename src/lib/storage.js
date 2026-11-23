const DATABASE_NAME = "hangbang-studio";
const STORE_NAME = "drafts";
const DRAFT_KEY = "current";
const STORAGE_TIMEOUT = 10_000;

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("当前浏览器无法使用本地存储，请尝试更新浏览器。"));
      return;
    }

    let settled = false;
    const timer = setTimeout(
      () => fail("本地存储响应超时，请刷新页面后重试。"),
      STORAGE_TIMEOUT,
    );
    const fail = (message) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(message));
    };

    let request;
    try {
      request = indexedDB.open(DATABASE_NAME, 1);
    } catch {
      fail("无法打开本地存储，请检查浏览器的隐私或存储设置。");
      return;
    }

    request.onupgradeneeded = () => {
      if (settled) {
        request.transaction?.abort();
        return;
      }
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onerror = () =>
      fail("无法打开本地存储，请检查浏览器的隐私或存储设置。");
    request.onblocked = () =>
      fail("本地存储正在被其他页面占用，请关闭其他排行榜页面后重试。");
    request.onsuccess = () => {
      const database = request.result;
      if (settled) {
        database.close();
        return;
      }
      settled = true;
      clearTimeout(timer);
      database.onversionchange = () => database.close();
      resolve(database);
    };
  });
}

function runTransaction(database, mode, operation) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let transaction;
    let result;
    let timer;

    const fail = (message) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        transaction?.abort();
      } catch {
        // A completed or already aborted transaction cannot be aborted again.
      }
      reject(new Error(message));
    };

    try {
      transaction = database.transaction(STORE_NAME, mode);
      timer = setTimeout(
        () => fail("本地存储响应超时，请刷新页面后重试。"),
        STORAGE_TIMEOUT,
      );
      transaction.oncomplete = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      };
      transaction.onabort = () => fail("本地存储操作已中断，请重试。");
      transaction.onerror = () =>
        fail("本地存储操作失败，请检查可用存储空间后重试。");

      const request = operation(transaction.objectStore(STORE_NAME));
      request.onsuccess = () => {
        result = request.result;
      };
      request.onerror = () =>
        fail("本地存储操作失败，请检查可用存储空间后重试。");
    } catch {
      fail("无法读写本地存储，请检查浏览器的隐私或存储设置。");
    }
  });
}

/** Return the most recently saved draft, or null on a first visit. */
export async function loadDraft() {
  const database = await openDatabase();
  try {
    const draft = await runTransaction(database, "readonly", (store) =>
      store.get(DRAFT_KEY),
    );
    return draft ?? null;
  } finally {
    database.close();
  }
}

/** Resolve only once the complete draft has been committed to IndexedDB. */
export async function saveDraft(draft) {
  const database = await openDatabase();
  try {
    await runTransaction(database, "readwrite", (store) =>
      store.put(draft, DRAFT_KEY),
    );
  } finally {
    database.close();
  }
}
