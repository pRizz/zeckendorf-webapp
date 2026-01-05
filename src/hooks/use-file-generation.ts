import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  padless_zeckendorf_decompress_be_dangerous,
  padless_zeckendorf_decompress_le_dangerous,
  zeck_file_to_bytes,
  type ZeckFile,
} from "@/../zeckendorf_rs_wasm/zeck.js";
import { downloadBlob } from "@/lib/compression";
import { formatBytes } from "@/lib/utils";
import { MAX_GENERATABLE_FILE_SIZE, ZECK_FLAG_BIG_ENDIAN } from "@/lib/constants";

export type GeneratingType = "wellCompressibleBE" | "wellCompressibleLE" | "compressedBE" | "compressedLE" | null;

export const useFileGeneration = () => {
  const [generatingType, setGeneratingType] = useState<GeneratingType>(null);
  const [customDataContentSize, setCustomDataContentSize] = useState<string>("");

  const validateCustomDataContentSize = useCallback((showToasts = true): number | null => {
    const maybeCustomDataContentSize = parseInt(customDataContentSize, 10);
    
    if (isNaN(maybeCustomDataContentSize) || maybeCustomDataContentSize <= 0) {
      if (showToasts) {
        toast.error("Please enter a valid positive number");
      }
      return null;
    }
    
    if (maybeCustomDataContentSize > MAX_GENERATABLE_FILE_SIZE) {
      if (showToasts) {
        toast.error(`Size must be at most ${MAX_GENERATABLE_FILE_SIZE.toLocaleString()} bytes`);
      }
      return null;
    }

    return maybeCustomDataContentSize;
  }, [customDataContentSize]);

  const handleGenerateWellCompressibleBE = useCallback(() => {
    const maybeCustomDataContentSize = validateCustomDataContentSize();
    if (maybeCustomDataContentSize === null) return;
    const customDataContentSize = maybeCustomDataContentSize;

    setGeneratingType("wellCompressibleBE");

    try {
      // Generate compressed data of the specified size (filled with 0xFF)
      // 0xFF represents an All Ones Zeckendorf Number, which expands when decompressed
      const compressedData = new Uint8Array(customDataContentSize);
      compressedData.fill(0xFF);
      
      // Decompress to get the original well compressible data
      const decompressedData = padless_zeckendorf_decompress_be_dangerous(compressedData);
      
      // Download well compressible file
      const wellCompressibleBEBlob = new Blob([new Uint8Array(decompressedData)]);
      downloadBlob(wellCompressibleBEBlob, `${customDataContentSize}BytesWellCompressibleBE.bin`);
      
      toast.success(`Generated well compressible file (BE): ${formatBytes(customDataContentSize)} compressed → ${formatBytes(decompressedData.length)} original`);
    } catch (error) {
      console.error("Error generating well compressible file (BE):", error);
      toast.error("Failed to generate well compressible file");
    } finally {
      setGeneratingType(null);
    }
  }, [validateCustomDataContentSize]);

  const handleGenerateWellCompressibleLE = useCallback(() => {
    const maybeCustomDataContentSize = validateCustomDataContentSize();
    if (maybeCustomDataContentSize === null) return;
    const customDataContentSize = maybeCustomDataContentSize;

    setGeneratingType("wellCompressibleLE");

    try {
      // Generate compressed data of the specified size (filled with 0xFF)
      // 0xFF represents an All Ones Zeckendorf Number, which expands when decompressed
      const compressedData = new Uint8Array(customDataContentSize);
      compressedData.fill(0xFF);
      
      // Decompress to get the original well compressible data
      const decompressedData = padless_zeckendorf_decompress_le_dangerous(compressedData);
      
      // Download well compressible file
      const wellCompressibleLEBlob = new Blob([new Uint8Array(decompressedData)]);
      downloadBlob(wellCompressibleLEBlob, `${customDataContentSize}BytesWellCompressibleLE.bin`);
      
      toast.success(`Generated well compressible file (LE): ${formatBytes(customDataContentSize)} compressed → ${formatBytes(decompressedData.length)} original`);
    } catch (error) {
      console.error("Error generating well compressible file (LE):", error);
      toast.error("Failed to generate well compressible file");
    } finally {
      setGeneratingType(null);
    }
  }, [validateCustomDataContentSize]);

  const handleGenerateCompressedBE = useCallback((): void => {
    const maybeCustomDataContentSize = validateCustomDataContentSize();
    if (maybeCustomDataContentSize === null) return;
    const customDataContentSize = maybeCustomDataContentSize;

    setGeneratingType("compressedBE");

    try {
      // Generate compressed data of the specified size (filled with 0xFF)
      // 0xFF represents an All Ones Zeckendorf Number, which expands when decompressed
      const compressedData = new Uint8Array(customDataContentSize);
      compressedData.fill(0xFF);
      
      // Decompress to determine the original size
      const decompressedData = padless_zeckendorf_decompress_be_dangerous(compressedData);
      const originalSize = decompressedData.length;
      
      // Create a ZeckFile object with sample compressed data (big endian)
      const sampleZeckFile: ZeckFile = {
        version: 1,
        original_size: originalSize,
        flags: ZECK_FLAG_BIG_ENDIAN, // big endian
        compressed_data: Array.from(compressedData),
      };
      
      // Serialize to bytes using the WASM function
      const zeckFileBytes = zeck_file_to_bytes(sampleZeckFile);
      
      // Download compressed file
      const zeckFileBlob = new Blob([new Uint8Array(zeckFileBytes)]);
      downloadBlob(zeckFileBlob, `${customDataContentSize}Plus10BytesCompressedBE.bin.zeck`);
      
      toast.success(`Generated compressed file (BE): ${formatBytes(customDataContentSize)}`);
    } catch (error) {
      console.error("Error generating compressed file (BE):", error);
      toast.error("Failed to generate compressed file");
    } finally {
      setGeneratingType(null);
    }
  }, [validateCustomDataContentSize]);

  const handleGenerateCompressedLE = useCallback((): void => {
    const maybeCustomDataContentSize = validateCustomDataContentSize();
    if (maybeCustomDataContentSize === null) return;
    const customDataContentSize = maybeCustomDataContentSize;

    setGeneratingType("compressedLE");

    try {
      // Generate compressed data of the specified size (filled with 0xFF)
      // 0xFF represents an All Ones Zeckendorf Number, which expands when decompressed
      const compressedData = new Uint8Array(customDataContentSize);
      compressedData.fill(0xFF);
      
      // Decompress to determine the original size
      const decompressedData = padless_zeckendorf_decompress_le_dangerous(compressedData);
      const originalSize = decompressedData.length;
      
      // Create a ZeckFile object with sample compressed data (little endian)
      const sampleZeckFile: ZeckFile = {
        version: 1,
        original_size: originalSize,
        flags: 0, // little endian
        compressed_data: Array.from(compressedData),
      };
      
      // Serialize to bytes using the WASM function
      const zeckFileBytes = zeck_file_to_bytes(sampleZeckFile);
      
      // Download compressed file
      const zeckFileBlob = new Blob([new Uint8Array(zeckFileBytes)]);
      downloadBlob(zeckFileBlob, `${customDataContentSize}Plus10BytesCompressedLE.bin.zeck`);
      
      toast.success(`Generated compressed file (LE): ${formatBytes(customDataContentSize)}`);
    } catch (error) {
      console.error("Error generating compressed file (LE):", error);
      toast.error("Failed to generate compressed file");
    } finally {
      setGeneratingType(null);
    }
  }, [validateCustomDataContentSize]);

  const handleDownloadSampleCompressedFileBE = useCallback((): void => {
    try {
      const sampleSize = 100;
      // Create sampleSize bytes of 0xFF, which represents an All Ones Zeckendorf Number
      // This expands when decompressed, allowing us to generate well-compressible test data
      const compressedData = new Uint8Array(sampleSize);
      compressedData.fill(0xFF);
      
      // Decompress to determine the original size
      const decompressedData = padless_zeckendorf_decompress_be_dangerous(compressedData);
      const originalSize = decompressedData.length;
      
      // Create a minimal ZeckFile object as a sample (big endian)
      const sampleZeckFile: ZeckFile = {
        version: 1,
        original_size: originalSize,
        flags: ZECK_FLAG_BIG_ENDIAN, // big endian
        compressed_data: Array.from(compressedData),
      };
      
      // Serialize to bytes using the WASM function
      const sampleZeckFileBytes = zeck_file_to_bytes(sampleZeckFile);
                  
      // Create blob and download
      const sampleZeckFileBlob = new Blob([new Uint8Array(sampleZeckFileBytes)]);
      downloadBlob(sampleZeckFileBlob, `${sampleSize}Plus10BytesCompressedSample.bin.zeck`);
      toast.success("Sample compressed file (big endian) downloaded successfully");
    } catch (error) {
      console.error("Error generating sample file:", error);
      toast.error("Failed to generate sample file");
    }
  }, []);

  const handleDownloadSampleCompressedFileLE = useCallback((): void => {
    try {
      const sampleSize = 100;
      // Create sampleSize bytes of 0xFF, which represents an All Ones Zeckendorf Number
      // This expands when decompressed, allowing us to generate well-compressible test data
      const compressedData = new Uint8Array(sampleSize);
      compressedData.fill(0xFF);
      
      // Decompress to determine the original size
      const decompressedData = padless_zeckendorf_decompress_le_dangerous(compressedData);
      const originalSize = decompressedData.length;
      
      // Create a minimal ZeckFile object as a sample (little endian)
      // This is just a sample - a real .zeck file would be generated by compression
      const sampleZeckFile: ZeckFile = {
        version: 1,
        original_size: originalSize,
        flags: 0, // little endian
        compressed_data: Array.from(compressedData),
      };
      
      // Serialize to bytes using the WASM function
      const sampleZeckFileBytes = zeck_file_to_bytes(sampleZeckFile);
                  
      // Create blob and download
      const sampleZeckFileBlob = new Blob([new Uint8Array(sampleZeckFileBytes)]);
      downloadBlob(sampleZeckFileBlob, `${sampleSize}Plus10BytesCompressedSample.bin.zeck`);
      toast.success("Sample compressed file (little endian) downloaded successfully");
    } catch (error) {
      console.error("Error generating sample file:", error);
      toast.error("Failed to generate sample file");
    }
  }, []);

  const handleDownloadWellCompressibleBE = useCallback(() => {
    try {
      const sampleSize = 100;
      // Create sampleSize bytes of 0xFF, which represents an All Ones Zeckendorf Number
      // This expands when decompressed, allowing us to generate well-compressible test data
      const compressedData = new Uint8Array(sampleSize);
      compressedData.fill(0xFF);
      
      // Decompress using big endian to get the original data that compresses well
      const decompressedData = padless_zeckendorf_decompress_be_dangerous(compressedData);
      
      // Create blob and download
      const wellCompressibleBEBlob = new Blob([new Uint8Array(decompressedData)]);
      downloadBlob(wellCompressibleBEBlob, `${sampleSize}BytesWellCompressibleBE.bin`);
      toast.success("Well compressible file (big endian) downloaded successfully");
    } catch (error) {
      console.error("Error generating well compressible file:", error);
      toast.error("Failed to generate well compressible file");
    }
  }, []);

  const handleDownloadWellCompressibleLE = useCallback(() => {
    try {
      const sampleSize = 100;
      // Create sampleSize bytes of 0xFF, which represents an All Ones Zeckendorf Number
      // This expands when decompressed, allowing us to generate well-compressible test data
      const compressedData = new Uint8Array(sampleSize);
      compressedData.fill(0xFF);
      
      // Decompress using little endian to get the original data that compresses well
      const decompressedData = padless_zeckendorf_decompress_le_dangerous(compressedData);
      
      // Create blob and download
      const wellCompressibleLEBlob = new Blob([new Uint8Array(decompressedData)]);
      downloadBlob(wellCompressibleLEBlob, `${sampleSize}BytesWellCompressibleLE.bin`);
      toast.success("Well compressible file (little endian) downloaded successfully");
    } catch (error) {
      console.error("Error generating well compressible file:", error);
      toast.error("Failed to generate well compressible file");
    }
  }, []);

  return {
    generatingType,
    customDataContentSize,
    setCustomDataContentSize,
    validateCustomDataContentSize,
    handleGenerateWellCompressibleBE,
    handleGenerateWellCompressibleLE,
    handleGenerateCompressedBE,
    handleGenerateCompressedLE,
    handleDownloadSampleCompressedFileBE,
    handleDownloadSampleCompressedFileLE,
    handleDownloadWellCompressibleBE,
    handleDownloadWellCompressibleLE,
  };
};

