import { useState, useCallback } from "react";
import { toast } from "sonner";
import { compressFileWithZeckendorf, downloadBlob } from "@/lib/compression";
import { formatBytes } from "@/lib/utils";
import type { CompressionLogEntry } from "@/components/CompressionLog";

interface CompressionFailureDialog {
  open: boolean;
  originalSize: number;
  beSize: number;
  leSize: number;
}

export const useFileCompression = (
  setLogEntries: React.Dispatch<React.SetStateAction<CompressionLogEntry[]>>
) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionFailureDialog, setCompressionFailureDialog] = useState<CompressionFailureDialog | null>(null);

  const proceedWithCompression = useCallback(async (fileToCompress: File) => {
    setIsCompressing(true);
    const startTime = Date.now();

    try {
      const compressionResult = await compressFileWithZeckendorf(fileToCompress, () => {});
      const elapsedTime = Date.now() - startTime;

      if (compressionResult.success) {
        downloadBlob(compressionResult.blob, compressionResult.filename);
        
        const originalSize = fileToCompress.size;
        const compressedContentSize = compressionResult.compressedContentSize;
        const totalFileSize = compressionResult.totalFileSize;
        const ratio = ((1 - compressedContentSize / originalSize) * 100).toFixed(1);
        
        // Add successful compression to log
        const newEntry: CompressionLogEntry = {
          id: crypto.randomUUID(),
          type: "compress",
          filename: fileToCompress.name,
          originalSize,
          compressedContentSize: compressedContentSize,
          totalFileSize,
          compressionType: compressionResult.endianness,
          compressionLevel: "auto",
          success: true,
          elapsedTime,
          timestamp: new Date(),
        };
        
        setLogEntries(prev => [newEntry, ...prev]);
        toast.success(`Compressed with ${compressionResult.endianness === "be" ? "big endian" : "little endian"}. Saved ${ratio}% (${formatBytes(originalSize)} → ${formatBytes(compressedContentSize)}). Total file size: ${formatBytes(totalFileSize)}`);
      } else if (compressionResult.success === false) {
        // Log failed compression attempt
        const failedEntry: CompressionLogEntry = {
          id: crypto.randomUUID(),
          type: "compress",
          filename: fileToCompress.name,
          originalSize: compressionResult.originalSize,
          success: false,
          error: "Compression did not reduce file size",
          beSize: compressionResult.beSize,
          leSize: compressionResult.leSize,
          elapsedTime,
          timestamp: new Date(),
        };
        
        setLogEntries(prev => [failedEntry, ...prev]);
        
        // Show failure dialog
        setCompressionFailureDialog({
          open: true,
          originalSize: compressionResult.originalSize,
          beSize: compressionResult.beSize,
          leSize: compressionResult.leSize,
        });
      }
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      console.error("Compression error:", error);
      
      // Log failed compression attempt with error
      const errorEntry: CompressionLogEntry = {
        id: crypto.randomUUID(),
        type: "compress",
        filename: fileToCompress.name,
        originalSize: fileToCompress.size,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        elapsedTime,
        timestamp: new Date(),
      };
      
      setLogEntries(prev => [errorEntry, ...prev]);
      toast.error("Failed to compress file. Please try again.");
    } finally {
      setIsCompressing(false);
    }
  }, [setLogEntries]);

  return {
    isCompressing,
    compressionFailureDialog,
    setCompressionFailureDialog,
    proceedWithCompression,
  };
};

