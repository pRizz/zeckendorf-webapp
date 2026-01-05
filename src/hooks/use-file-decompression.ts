import { useState, useCallback } from "react";
import { toast } from "sonner";
import { decompressZeckFile, downloadBlob } from "@/lib/compression";
import type { CompressionLogEntry } from "@/components/CompressionLog";

export const useFileDecompression = (
  setLogEntries: React.Dispatch<React.SetStateAction<CompressionLogEntry[]>>
) => {
  const [isDecompressing, setIsDecompressing] = useState(false);

  const proceedWithDecompression = useCallback(async (zeckFileToDecompress: File) => {
    setIsDecompressing(true);
    const startTime = Date.now();

    try {
      const decompressionResult = await decompressZeckFile(zeckFileToDecompress, () => {});
      const elapsedTime = Date.now() - startTime;

      if ("error" in decompressionResult) {
        // Log failed decompression attempt
        const failedEntry: CompressionLogEntry = {
          id: crypto.randomUUID(),
          type: "decompress",
          filename: zeckFileToDecompress.name,
          originalSize: zeckFileToDecompress.size,
          success: false,
          error: decompressionResult.error,
          elapsedTime,
          timestamp: new Date(),
        };
        
        setLogEntries(prev => [failedEntry, ...prev]);
        toast.error(decompressionResult.error);
      } else {
        downloadBlob(decompressionResult.blob, decompressionResult.filename);
        
        // Log successful decompression
        const successEntry: CompressionLogEntry = {
          id: crypto.randomUUID(),
          type: "decompress",
          filename: zeckFileToDecompress.name,
          originalSize: decompressionResult.totalFileSize, // Total .zeck file size
          compressedContentSize: decompressionResult.compressedContentSize, // Compressed content size (without header)
          totalFileSize: decompressionResult.totalFileSize, // Total .zeck file size (with header)
          decompressedSize: decompressionResult.blob.size,
          compressionType: decompressionResult.endianness, // Store endianness for display
          success: true,
          elapsedTime,
          timestamp: new Date(),
        };
        
        setLogEntries(prev => [successEntry, ...prev]);
        toast.success(`Decompressed file: ${decompressionResult.filename}`);
      }
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      console.error("Decompression error:", error);
      
      // Log failed decompression attempt with error
      const errorEntry: CompressionLogEntry = {
        id: crypto.randomUUID(),
        type: "decompress",
        filename: zeckFileToDecompress.name,
        originalSize: zeckFileToDecompress.size,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        elapsedTime,
        timestamp: new Date(),
      };
      
      setLogEntries(prev => [errorEntry, ...prev]);
      toast.error("Failed to decompress file. Please try again.");
    } finally {
      setIsDecompressing(false);
    }
  }, [setLogEntries]);

  return {
    isDecompressing,
    proceedWithDecompression,
  };
};

