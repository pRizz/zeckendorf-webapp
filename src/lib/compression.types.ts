/**
 * Shared types for compression operations and worker communication
 */

export type Endianness = "be" | "le";

export type CompressionResult = 
  | { success: true; blob: Blob; filename: string; endianness: Endianness; compressedContentSize: number; totalFileSize: number }
  | { success: false; originalSize: number; beSize: number; leSize: number };

export type DecompressionResult =
  | { success: true; blob: Blob; filename: string; endianness: Endianness; compressedContentSize: number; totalFileSize: number }
  | { error: string };

/**
 * Messages sent from the main thread to the worker
 */
export type WorkerRequest =
  | {
      type: "compress";
      id: string;
      dataToCompress: Uint8Array;
      filename: string;
    }
  | {
      type: "decompress";
      id: string;
      zeckFileData: Uint8Array;
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
      compressedData: Uint8Array;
      filename: string;
      endianness: Endianness;
      originalSize: number;
      compressedContentSize: number; // Compressed content size (without header)
      totalFileSize: number; // Total .zeck file size (with header)
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
      type: "compress";
      id: string;
      success: false;
      error: string;
      originalSize: number;
    }
  | {
      type: "decompress";
      id: string;
      success: true;
      decompressedData: Uint8Array;
      filename: string;
      endianness: Endianness;
      compressedContentSize: number; // Compressed content size (without header)
      totalFileSize: number; // Total .zeck file size (with header)
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

