/**
 * Shared types for compression operations and worker communication
 */

export type CompressionResult = 
  | { success: true; blob: Blob; filename: string; endianness: "be" | "le" }
  | { success: false; originalSize: number; beSize: number; leSize: number };

/**
 * Messages sent from the main thread to the worker
 */
export type WorkerRequest =
  | {
      type: "compress";
      id: string;
      data: Uint8Array;
      filename: string;
    }
  | {
      type: "decompress";
      id: string;
      data: Uint8Array;
      filename: string;
    };

/**
 * Messages sent from the worker to the main thread
 */
export type WorkerResponse =
  | {
      type: "compress";
      id: string;
      success: true;
      blob: Uint8Array;
      filename: string;
      endianness: "be" | "le";
      originalSize: number;
      compressedSize: number;
    }
  | {
      type: "compress";
      id: string;
      success: false;
      originalSize: number;
      beSize: number;
      leSize: number;
    }
  | {
      type: "decompress";
      id: string;
      success: true;
      blob: Uint8Array;
      filename: string;
    }
  | {
      type: "decompress";
      id: string;
      success: false;
      error: string;
    }
  | {
      type: "progress";
      id: string;
      progress: number;
    }
  | {
      type: "error";
      id: string;
      error: string;
    };

