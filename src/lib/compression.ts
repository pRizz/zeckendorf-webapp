import CompressionWorker from "./compression.worker?worker";
import type { CompressionResult, WorkerRequest, WorkerResponse } from "./compression.types";

export type { CompressionResult };

// Singleton worker instance
let maybeWorker: Worker | null = null;

const getWorker = (): Worker => {
  if (maybeWorker === null) {
    maybeWorker = new CompressionWorker();
  }
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
 * Returns the compressed file if either endianness produces a smaller file, otherwise returns failure info.
 * All compression work is done off the main thread in a web worker.
 */
export const compressFileWithZeckendorf = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<CompressionResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const worker = getWorker();
  const id = crypto.randomUUID();

  return new Promise<CompressionResult>((resolve, reject) => {
    const messageHandler = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;

      if (response.id !== id) {
        return;
      }

      if (response.type === "progress") {
        onProgress(response.progress);
      } else if (response.type === "compress") {
        worker.removeEventListener("message", messageHandler);
        if (response.success === true) {
          resolve({
            success: true,
            blob: new Blob([new Uint8Array(response.blob)]),
            filename: response.filename,
            endianness: response.endianness,
          });
        } else if (response.success === false) {
          resolve({
            success: false,
            originalSize: response.originalSize,
            beSize: response.beSize,
            leSize: response.leSize,
          });
        }
      } else if (response.type === "error") {
        worker.removeEventListener("message", messageHandler);
        reject(new Error(response.error));
      }
    };

    worker.addEventListener("message", messageHandler);

    const message: WorkerRequest = {
      type: "compress",
      id,
      data: uint8Array,
      filename: file.name,
    };

    // Transfer the ArrayBuffer ownership to the worker (zero-copy transfer)
    worker.postMessage(message, [uint8Array.buffer]);
  });
};

/**
 * Internal helper function that handles decompression via worker.
 * Returns the decompressed data and filename, or throws an error.
 */
const decompressViaWorker = async (
  data: Uint8Array,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<{ blob: Uint8Array; filename: string }> => {
  const worker = getWorker();
  const id = crypto.randomUUID();

  return new Promise<{ blob: Uint8Array; filename: string }>((resolve, reject) => {
    const messageHandler = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;

      if (response.id !== id) {
        return;
      }

      if (response.type === "progress" && onProgress) {
        onProgress(response.progress);
      } else if (response.type === "decompress") {
        worker.removeEventListener("message", messageHandler);
        if (response.success === true) {
          resolve({
            blob: response.blob,
            filename: response.filename,
          });
        } else if (response.success === false) {
          reject(new Error(response.error));
        }
      } else if (response.type === "error") {
        worker.removeEventListener("message", messageHandler);
        reject(new Error(response.error));
      }
    };

    worker.addEventListener("message", messageHandler);

    const message: WorkerRequest = {
      type: "decompress",
      id,
      data,
      filename,
    };

    // Transfer the ArrayBuffer ownership to the worker (zero-copy transfer)
    worker.postMessage(message, [data.buffer]);
  });
};

/**
 * Decompresses a file based on its extension (.zbe for big endian, .zle for little endian).
 * All decompression work is done off the main thread in a web worker.
 */
export const decompressFileWithZeckendorf = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<{ blob: Blob; filename: string } | { error: string }> => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  try {
    const result = await decompressViaWorker(uint8Array, file.name, onProgress);
    return {
      blob: new Blob([new Uint8Array(result.blob)]),
      filename: result.filename,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Decompresses a Uint8Array directly using the specified endianness.
 * This is a helper function for operations that don't involve File objects.
 * All decompression work is done off the main thread in a web worker.
 */
export const decompressUint8Array = async (
  data: Uint8Array,
  endianness: "be" | "le",
  onProgress?: (progress: number) => void
): Promise<Uint8Array> => {
  const filename = endianness === "be" ? "data.zbe" : "data.zle";
  const result = await decompressViaWorker(data, filename, onProgress);
  return new Uint8Array(result.blob);
};

// Legacy functions for backward compatibility (if needed elsewhere)
// Note: This function still uses the worker for consistency
export const compressFiles = async (
  files: File[],
  format: "zeckendorf_be" | "zeckendorf_le",
  _level: "fast" | "balanced" | "maximum",
  onProgress: (progress: number) => void
): Promise<{ blob: Blob; filename: string }> => {
  if (files.length !== 1) {
    throw new Error("Zeckendorf compression only supports single file compression");
  }

  const maybeFile = files[0];
  if (!maybeFile) {
    throw new Error("No file provided");
  }
  const result = await compressFileWithZeckendorf(maybeFile, onProgress);

  if (!result.success) {
    throw new Error("Compression failed");
  }

  // If the result doesn't match the requested format, we need to recompress
  // This is a legacy function, so we'll just return what we got
  if (
    (format === "zeckendorf_be" && result.endianness !== "be") ||
    (format === "zeckendorf_le" && result.endianness !== "le")
  ) {
    // For legacy compatibility, we'll still return the result
    // but note that it may not match the requested format
    return {
      blob: result.blob,
      filename: result.filename,
    };
  }

  return {
    blob: result.blob,
    filename: result.filename,
  };
};
