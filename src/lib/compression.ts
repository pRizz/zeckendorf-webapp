import CompressionWorker from "./compression.worker?worker";
import type { CompressionResult, DecompressionResult, WorkerRequest, WorkerResponse } from "./compression.types";

export type { CompressionResult, DecompressionResult };

// Singleton worker instance
let maybeWorker: Worker | null = null;

const getWorker = (): Worker => {
  maybeWorker ??= new CompressionWorker();
  return maybeWorker;
};

/**
 * Initializes the compression worker eagerly.
 * Call this at app startup to ensure the worker and WASM module are ready before first use.
 */
export const initializeWorker = (): void => {
  getWorker();
};

/**
 * Compresses a file using Zeckendorf compression, automatically selecting the best endianness.
 * Returns the compressed file if compression produces a smaller file, otherwise returns failure info.
 * All compression work is done off the main thread in a web worker.
 */
export const compressFileWithZeckendorf = async (
  fileToCompress: File,
  onProgress: (progress: number) => void
): Promise<CompressionResult> => {
  const dataToCompressArrayBuffer = await fileToCompress.arrayBuffer();
  const dataToCompressUint8Array = new Uint8Array(dataToCompressArrayBuffer);
  const worker = getWorker();
  const id = crypto.randomUUID();

  return new Promise<CompressionResult>((resolve, reject) => {
    const messageHandler = (event: MessageEvent<WorkerResponse>): void => {
      const workerResponse = event.data;

      if (workerResponse.id !== id) {
        return;
      }

      if (workerResponse.type === "progress") {
        onProgress(workerResponse.progress);
      } else if (workerResponse.type === "compress") {
        worker.removeEventListener("message", messageHandler);
        if (workerResponse.success === true) {
          resolve({
            success: true,
            blob: new Blob([new Uint8Array(workerResponse.compressedData)]),
            filename: workerResponse.filename,
            endianness: workerResponse.endianness,
            compressedContentSize: workerResponse.compressedContentSize,
            totalFileSize: workerResponse.totalFileSize,
          });
        } else if (workerResponse.success === false) {
          resolve({
            success: false,
            originalSize: workerResponse.originalSize,
            beSize: workerResponse.beSize,
            leSize: workerResponse.leSize,
          });
        }
      } else if (workerResponse.type === "error") {
        worker.removeEventListener("message", messageHandler);
        reject(new Error(workerResponse.error));
      }
    };

    worker.addEventListener("message", messageHandler);

    const message: WorkerRequest = {
      type: "compress",
      id,
      dataToCompress: dataToCompressUint8Array,
      filename: fileToCompress.name,
    };

    // Transfer the ArrayBuffer ownership to the worker (zero-copy transfer)
    worker.postMessage(message, [dataToCompressUint8Array.buffer]);
  });
};

/**
 * Internal helper function that handles decompression of Zeck file data via worker.
 * Returns the decompressed data and filename, or throws an error.
 */
const decompressZeckFileDataViaWorker = async (
  zeckFileData: Uint8Array,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<DecompressionResult> => {
  const worker = getWorker();
  const id = crypto.randomUUID();

  return new Promise<DecompressionResult>((resolve, reject) => {
    const messageHandler = (event: MessageEvent<WorkerResponse>): void => {
      const workerResponse = event.data;

      if (workerResponse.id !== id) {
        return;
      }

      if (workerResponse.type === "progress" && onProgress) {
        onProgress(workerResponse.progress);
      } else if (workerResponse.type === "decompress") {
        worker.removeEventListener("message", messageHandler);
        if (workerResponse.success === true) {
          resolve({
            success: true,
            blob: new Blob([new Uint8Array(workerResponse.decompressedData)]),
            filename: workerResponse.filename,
            compressedContentSize: workerResponse.compressedContentSize,
            totalFileSize: workerResponse.totalFileSize,
          });
        } else if (workerResponse.success === false) {
          reject(new Error(workerResponse.error));
        }
      } else if (workerResponse.type === "error") {
        worker.removeEventListener("message", messageHandler);
        reject(new Error(workerResponse.error));
      }
    };

    worker.addEventListener("message", messageHandler);

    const message: WorkerRequest = {
      type: "decompress",
      id,
      zeckFileData,
      filename,
    };

    // Transfer the ArrayBuffer ownership to the worker (zero-copy transfer)
    worker.postMessage(message, [zeckFileData.buffer]);
  });
};

/**
 * Decompresses a .zeck file and returns a `Promise<DecompressionResult>`.
 * 
 * All decompression work is done off the main thread in a web worker.
 */
export const decompressZeckFile = async (
  zeckFile: File,
  onProgress: (progress: number) => void
): Promise<DecompressionResult> => {
  const zeckFileArrayBuffer = await zeckFile.arrayBuffer();
  const zeckFileUint8ArrayData = new Uint8Array(zeckFileArrayBuffer);

  try {
    return await decompressZeckFileDataViaWorker(zeckFileUint8ArrayData, zeckFile.name, onProgress);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
