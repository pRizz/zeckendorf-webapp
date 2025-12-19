import JSZip from "jszip";
import pako from "pako";
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

    return { blob, filename: "compressed.zip" };
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
