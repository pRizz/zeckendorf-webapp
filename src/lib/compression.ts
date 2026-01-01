import { zeckendorf_compress_be, zeckendorf_compress_le, zeckendorf_decompress_be, zeckendorf_decompress_le } from "@/../zeckendorf_rs_wasm/zeckendorf_rs.js";

export type CompressionResult = 
  | { success: true; blob: Blob; filename: string; endianness: "be" | "le" }
  | { success: false; originalSize: number; beSize: number; leSize: number };

/**
 * Compresses a file using Zeckendorf compression, automatically selecting the best endianness.
 * Returns the compressed file if either endianness produces a smaller file, otherwise returns failure info.
 */
export const compressFileWithZeckendorf = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<CompressionResult> => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const originalSize = file.size;

  onProgress(30);

  // Try big endian compression first
  const compressedBE = zeckendorf_compress_be(uint8Array);
  const beSize = compressedBE.length;

  onProgress(60);

  // Try little endian compression
  const compressedLE = zeckendorf_compress_le(uint8Array);
  const leSize = compressedLE.length;

  onProgress(90);

  // Check if either compression is smaller than original
  if (beSize < originalSize) {
    // Big endian is better
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    return {
      success: true,
      blob: new Blob([new Uint8Array(compressedBE)]),
      filename: `${baseName}.zbe`,
      endianness: "be",
    };
  }

  if (leSize < originalSize) {
    // Little endian is better
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    return {
      success: true,
      blob: new Blob([new Uint8Array(compressedLE)]),
      filename: `${baseName}.zle`,
      endianness: "le",
    };
  }

  // Both compressions produced larger files
  onProgress(100);
  return {
    success: false,
    originalSize,
    beSize,
    leSize,
  };
};

/**
 * Decompresses a file based on its extension (.zbe for big endian, .zle for little endian).
 */
export const decompressFileWithZeckendorf = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<{ blob: Blob; filename: string } | { error: string }> => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  onProgress(30);

  // Detect compression type from file extension
  const fileName = file.name.toLowerCase();
  let decompressed: Uint8Array;
  let originalFilename: string;

  onProgress(100);

  if (fileName.endsWith(".zbe")) {
    // Big endian decompression
    decompressed = zeckendorf_decompress_be(uint8Array);
    originalFilename = file.name.replace(/\.zbe$/i, "");

    return {
      blob: new Blob([new Uint8Array(decompressed)]),
      filename: originalFilename,
    };
  }
  
  if (fileName.endsWith(".zle")) {
    // Little endian decompression
    decompressed = zeckendorf_decompress_le(uint8Array);
    originalFilename = file.name.replace(/\.zle$/i, "");

    return {
      blob: new Blob([new Uint8Array(decompressed)]),
      filename: originalFilename,
    };
  }

  return {
    error: "Could not detect which compression was used. File extension must be .zbe (big endian) or .zle (little endian).",
  };
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

// Legacy functions for backward compatibility (if needed elsewhere)
export const compressFiles = async (
  files: File[],
  format: "zeckendorf_be" | "zeckendorf_le",
  level: "fast" | "balanced" | "maximum",
  onProgress: (progress: number) => void
): Promise<{ blob: Blob; filename: string }> => {
  if (files.length !== 1) {
    throw new Error("Zeckendorf compression only supports single file compression");
  }

  const file = files[0];
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  onProgress(30);

  let compressed: Uint8Array;
  let filename: string;

  if (format === "zeckendorf_be") {
    compressed = zeckendorf_compress_be(uint8Array);
    filename = `${file.name}.zbe`;
  } else {
    compressed = zeckendorf_compress_le(uint8Array);
    filename = `${file.name}.zle`;
  }

  onProgress(100);

  return {
    blob: new Blob([new Uint8Array(compressed)]),
    filename,
  };
};
