import JSZip from "jszip";
import pako from "pako";
import { zeckendorf_compress_be, zeckendorf_compress_le } from "@/../zeckendorf_rs_wasm/zeckendorf_rs.js";
import type { CompressionFormat, CompressionLevel } from "@/components/CompressionOptions";

const getLevelValue = (level: CompressionLevel): number => {
  switch (level) {
    case "fast":
      return 1;
    case "balanced":
      return 5;
    case "maximum":
      return 9;
    default:
      return 5;
  }
};

export const compressFiles = async (
  files: File[],
  format: CompressionFormat,
  level: CompressionLevel,
  onProgress: (progress: number) => void
): Promise<{ blob: Blob; filename: string }> => {
  const compressionLevel = getLevelValue(level);

  if (format === "zip") {
    const zip = new JSZip();
    
    // Add files to zip
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      zip.file(file.name, arrayBuffer);
    }

    // Generate zip with progress
    const blob = await zip.generateAsync(
      { 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: compressionLevel }
      },
      (metadata) => {
        onProgress(metadata.percent);
      }
    );

    // Use original filename for single file, or first file's name for multiple
    const baseName = files.length === 1 
      ? files[0].name.replace(/\.[^/.]+$/, "") 
      : files[0].name.replace(/\.[^/.]+$/, "") + "_and_more";
    
    return { blob, filename: `${baseName}.zip` };
  }

  if (format === "gzip" || format === "deflate") {
    // For single file compression
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    onProgress(30);

    let compressed: Uint8Array;
    let filename: string;

    if (format === "gzip") {
      compressed = pako.gzip(uint8Array, { level: compressionLevel });
      filename = `${file.name}.gz`;
    } else {
      compressed = pako.deflate(uint8Array, { level: compressionLevel });
      filename = `${file.name}.deflate`;
    }

    onProgress(100);

    return {
      blob: new Blob([new Uint8Array(compressed)]),
      filename,
    };
  }

  if (format === "zeckendorf_be") {
    // For single file compression using Zeckendorf algorithm (interpret input as a big endian integer)
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    onProgress(30);

    // Compress using Zeckendorf algorithm (interpret input as a big endian integer)
    const compressed = zeckendorf_compress_be(uint8Array);

    onProgress(100);

    return {
      blob: new Blob([new Uint8Array(compressed)]),
      filename: `${file.name}.zbe`,
    };
  }

  if (format === "zeckendorf_le") {
    // For single file compression using Zeckendorf algorithm (interpret input as a little endian integer)
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    onProgress(30);

    // Compress using Zeckendorf algorithm (interpret input as a little endian integer)
    const compressed = zeckendorf_compress_le(uint8Array);

    onProgress(100);

    return {
      blob: new Blob([new Uint8Array(compressed)]),
      filename: `${file.name}.zle`,
    };
  }

  throw new Error(`Unsupported format: ${format}`);
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
