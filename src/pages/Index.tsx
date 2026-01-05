import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { FileArchive, Loader2, Upload, FileDown } from "lucide-react";
import { toast } from "sonner";
import { CompressionLog, CompressionLogEntry } from "@/components/CompressionLog";
import { compressFileWithZeckendorf, decompressZeckFile, downloadBlob } from "@/lib/compression";
import {
  padless_zeckendorf_decompress_be_dangerous,
  padless_zeckendorf_decompress_le_dangerous,
  zeck_file_to_bytes,
  type ZeckFile,
} from "@/../zeckendorf_rs_wasm/zeck.js";
import { formatBytes, formatElapsedTimeShort } from "@/lib/utils";
import { MEDIUM_ARTICLE_URL, MAX_GENERATABLE_FILE_SIZE, ZECK_FILE_HEADER_SIZE, FILE_SIZE_WARNING_THRESHOLD } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Index = (): JSX.Element => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDecompressing, setIsDecompressing] = useState(false);
  const [isDragActiveCompress, setIsDragActiveCompress] = useState(false);
  const [isDragActiveDecompress, setIsDragActiveDecompress] = useState(false);
  const [logEntries, setLogEntries] = useState<CompressionLogEntry[]>([]);
  const [compressionFailureDialog, setCompressionFailureDialog] = useState<{
    open: boolean;
    originalSize: number;
    beSize: number;
    leSize: number;
  } | null>(null);
  const [customDataDialogOpen, setCustomDataDialogOpen] = useState(false);
  const [customDataContentSize, setCustomDataContentSize] = useState<string>("");
  const [generatingType, setGeneratingType] = useState<"wellCompressibleBE" | "wellCompressibleLE" | "compressedBE" | "compressedLE" | null>(null);
  const [elapsedMilliseconds, setElapsedMilliseconds] = useState<number>(0);
  const [compressElapsedMilliseconds, setCompressElapsedMilliseconds] = useState<number>(0);
  const [decompressElapsedMilliseconds, setDecompressElapsedMilliseconds] = useState<number>(0);
  const [multipleFilesWarningDialog, setMultipleFilesWarningDialog] = useState<{
    open: boolean;
    action: "compress" | "decompress";
  } | null>(null);
  const [largeFileWarningDialog, setLargeFileWarningDialog] = useState<{
    open: boolean;
    file: File;
    action: "compress" | "decompress";
  } | null>(null);
  const [noFilesWarningDialog, setNoFilesWarningDialog] = useState<{
    open: boolean;
    action: "compress" | "decompress";
  } | null>(null);

  const ZECK_FLAG_BIG_ENDIAN = 0x01;

  const STORAGE_KEY = "zeckendorf_compression_log";

  // Load log entries from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        // Convert timestamp strings back to Date objects
        if (Array.isArray(parsed)) {
          const entries = parsed.map((entry: unknown) => {
            if (typeof entry === "object" && entry !== null && "timestamp" in entry) {
              return {
                ...(entry as CompressionLogEntry),
                timestamp: new Date((entry as { timestamp: string | Date }).timestamp),
              };
            }
            return entry as CompressionLogEntry;
          });
          setLogEntries(entries);
        }
      }
    } catch (error) {
      console.error("Failed to load log entries from localStorage:", error);
    }
  }, []);

  // Save log entries to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logEntries));
    } catch (error) {
      console.error("Failed to save log entries to localStorage:", error);
    }
  }, [logEntries]);

  // Track elapsed time during generation
  useEffect(() => {
    if (generatingType === null) {
      setElapsedMilliseconds(0);
      return;
    }

    const startTime = Date.now();
    setElapsedMilliseconds(0);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedMilliseconds(elapsed);
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [generatingType]);

  // Track elapsed time during compression
  useEffect(() => {
    if (!isCompressing) {
      setCompressElapsedMilliseconds(0);
      return;
    }

    const startTime = Date.now();
    setCompressElapsedMilliseconds(0);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setCompressElapsedMilliseconds(elapsed);
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [isCompressing]);

  // Track elapsed time during decompression
  useEffect(() => {
    if (!isDecompressing) {
      setDecompressElapsedMilliseconds(0);
      return;
    }

    const startTime = Date.now();
    setDecompressElapsedMilliseconds(0);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setDecompressElapsedMilliseconds(elapsed);
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [isDecompressing]);

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
          compressionType: `zeckendorf_${compressionResult.endianness}`,
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
  }, []);

  const handleCompress = useCallback((filesToCompress: File[]) => {
    if (filesToCompress.length === 0) {
      setNoFilesWarningDialog({
        open: true,
        action: "compress",
      });
      return;
    }

    if (filesToCompress.length > 1) {
      setMultipleFilesWarningDialog({
        open: true,
        action: "compress",
      });
      return;
    }

    const maybeFirstFileToCompress = filesToCompress[0];
    if (!maybeFirstFileToCompress) return;
    const fileToCompress = maybeFirstFileToCompress;

    // Check file size and show warning if larger than threshold
    if (fileToCompress.size > FILE_SIZE_WARNING_THRESHOLD) {
      setLargeFileWarningDialog({
        open: true,
        file: fileToCompress,
        action: "compress",
      });
      return;
    }

    void proceedWithCompression(fileToCompress);
  }, [proceedWithCompression]);

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
  }, []);

  const handleDecompress = useCallback((filesToDecompress: File[]) => {
    if (filesToDecompress.length === 0) {
      setNoFilesWarningDialog({
        open: true,
        action: "decompress",
      });
      return;
    }

    if (filesToDecompress.length > 1) {
      setMultipleFilesWarningDialog({
        open: true,
        action: "decompress",
      });
      return;
    }

    const maybeFirstZeckFileToDecompress = filesToDecompress[0];
    if (!maybeFirstZeckFileToDecompress) return;
    const zeckFileToDecompress = maybeFirstZeckFileToDecompress;

    // Check file size and show warning if larger than threshold
    if (zeckFileToDecompress.size > FILE_SIZE_WARNING_THRESHOLD) {
      setLargeFileWarningDialog({
        open: true,
        file: zeckFileToDecompress,
        action: "decompress",
      });
      return;
    }

    void proceedWithDecompression(zeckFileToDecompress);
  }, [proceedWithDecompression]);

  const handleDragCompress = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActiveCompress(true);
    } else if (e.type === "dragleave") {
      setIsDragActiveCompress(false);
    }
  }, []);

  const handleDragDecompress = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActiveDecompress(true);
    } else if (e.type === "dragleave") {
      setIsDragActiveDecompress(false);
    }
  }, []);

  const handleDropCompress = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActiveCompress(false);

      if (isCompressing) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        void handleCompress(droppedFiles);
      }
    },
    [isCompressing, handleCompress]
  );

  const handleDropDecompress = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActiveDecompress(false);

      if (isDecompressing) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        void handleDecompress(droppedFiles);
      }
    },
    [isDecompressing, handleDecompress]
  );

  const handleFileInputCompress = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isCompressing) return;
      
      const selectedFiles = Array.from(e.target.files ?? []);
      if (selectedFiles.length > 0) {
        void handleCompress(selectedFiles);
      }
      e.target.value = "";
    },
    [isCompressing, handleCompress]
  );

  const handleFileInputDecompress = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isDecompressing) return;
      
      const selectedFiles = Array.from(e.target.files ?? []);
      if (selectedFiles.length > 0) {
        void handleDecompress(selectedFiles);
      }
      e.target.value = "";
    },
    [isDecompressing, handleDecompress]
  );

  const clearLog = (): void => {
    setLogEntries([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear log from localStorage:", error);
    }
  };

  const handleDownloadSampleCompressedFileBE = useCallback((): void => {
    try {
      const sampleSize = 100;
      // Create sampleSize bytes of 0xFF, which represents an All Ones Zeckendorf Number
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 gradient-primary rounded-full blur-[128px] opacity-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 gradient-primary rounded-full blur-[128px] opacity-10" />
      </div>

      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span className="text-gradient">Zeckendorf</span> Compression
            </h1>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-flex items-center justify-center p-4 rounded-2xl bg-secondary/50 border border-border"
            >
                  <FileArchive className="w-10 h-10 text-primary" aria-hidden="true" />
            </motion.div>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Compress and decompress files using the Zeckendorf algorithm.<br />
            Automatically selects the best endianness interpretation.<br />
            All processing happens locally in your browser.
          </p>
          <a
              href={MEDIUM_ARTICLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Learn more
            </a>


          {/* Features */}
          {/* <div className="flex justify-center gap-6 mt-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <feature.icon className="w-4 h-4 text-primary" />
                <span>{feature.label}</span>
              </motion.div>
            ))}
          </div> */}
        </motion.header>

        {/* Main content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
          aria-label="Compression and decompression tools"
        >
          {/* Compress Section */}
          <section aria-labelledby="compress-heading">
            <h2 id="compress-heading" className="text-2xl font-semibold mb-4">Compress</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Drop a file to compress with Zeckendorf. We'll automatically try both big endian and little endian and use whichever produces a smaller result. The odds of a file being compressed with Zeckendorf are very low, so this is mostly for fun.{" "}
              <button
                onClick={() => {
                  void handleDownloadWellCompressibleBE();
                }}
                className="text-primary hover:underline font-medium"
                type="button"
              >
                Download a well compressible file (big endian)
              </button>
              {" "}or{" "}
              <button
                onClick={() => {
                  void handleDownloadWellCompressibleLE();
                }}
                className="text-primary hover:underline font-medium"
                type="button"
              >
                Download a well compressible file (little endian)
              </button>
              {" "}to try it out. Due to time and memory pressure, it is recommended to only attempt compressing files no greater than about 15KB. Wanna help optimize the algorithm? Check out the <a href="https://github.com/pRizz/zeckendorf" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Rust code</a> and submit a pull request!
            </p>
            <motion.div
              className={`
                relative overflow-hidden rounded-2xl border-2 border-dashed 
                transition-all duration-300 cursor-pointer
                ${isCompressing 
                  ? "border-primary/50 bg-primary/5 cursor-wait" 
                  : isDragActiveCompress
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-card/50"
                }
              `}
              whileHover={!isCompressing ? { scale: 1.01 } : {}}
              whileTap={!isCompressing ? { scale: 0.99 } : {}}
              onDragEnter={handleDragCompress}
              onDragLeave={handleDragCompress}
              onDragOver={handleDragCompress}
              onDrop={handleDropCompress}
            >
              <label className={`block ${isCompressing ? "cursor-wait" : "cursor-pointer"} p-12`}>
                <input
                  type="file"
                  onChange={handleFileInputCompress}
                  className="hidden"
                  disabled={isCompressing}
                />
                <div className="flex flex-col items-center justify-center text-center">
                  <motion.div
                    animate={
                      isCompressing 
                        ? { rotate: 360 } 
                        : { scale: 1, rotate: 0 }
                    }
                    transition={
                      isCompressing 
                        ? { repeat: Infinity, duration: 1, ease: "linear" } 
                        : { type: "spring", stiffness: 300 }
                    }
                    className="mb-6"
                  >
                    <div className="relative">
                      <div className={`absolute inset-0 gradient-primary rounded-full blur-2xl opacity-30 ${isCompressing ? "" : "animate-pulse-glow"}`} />
                      <div className="relative p-5 rounded-full bg-secondary">
                        {isCompressing ? (
                          <Loader2 className="w-10 h-10 text-primary" />
                        ) : (
                          <Upload className="w-10 h-10 text-primary" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2">
                    {isCompressing 
                      ? `Compressing... ${formatElapsedTimeShort(compressElapsedMilliseconds)}` 
                      : "Drop file to compress"
                    }
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {isCompressing 
                      ? "Trying both endianness options..." 
                      : <>or <span className="text-primary font-medium">click to browse</span></>
                    }
                  </p>
                </div>
              </label>
            </motion.div>
          </section>

          {/* Decompress Section */}
          <section aria-labelledby="decompress-heading">
            <h2 id="decompress-heading" className="text-2xl font-semibold mb-4">Decompress</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Drop a compressed file (.zeck) to decompress.{" "}
              <button
                onClick={() => {
                  handleDownloadSampleCompressedFileBE();
                }}
                className="text-primary hover:underline font-medium"
                type="button"
              >
                Download a sample compressed file (.zeck, BE)
              </button>
              {" "}or{" "}
              <button
                onClick={() => {
                  handleDownloadSampleCompressedFileLE();
                }}
                className="text-primary hover:underline font-medium"
                type="button"
              >
                Download a sample compressed file (.zeck, LE)
              </button>
              {" "}to try it out. The sample file consists of 100 bytes of an all ones Zeckendorf Number.
            </p>
            <motion.div
              className={`
                relative overflow-hidden rounded-2xl border-2 border-dashed 
                transition-all duration-300 cursor-pointer
                ${isDecompressing 
                  ? "border-primary/50 bg-primary/5 cursor-wait" 
                  : isDragActiveDecompress
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-card/50"
                }
              `}
              whileHover={!isDecompressing ? { scale: 1.01 } : {}}
              whileTap={!isDecompressing ? { scale: 0.99 } : {}}
              onDragEnter={handleDragDecompress}
              onDragLeave={handleDragDecompress}
              onDragOver={handleDragDecompress}
              onDrop={handleDropDecompress}
            >
              <label className={`block ${isDecompressing ? "cursor-wait" : "cursor-pointer"} p-12`}>
                <input
                  type="file"
                  onChange={handleFileInputDecompress}
                  className="hidden"
                  disabled={isDecompressing}
                />
                <div className="flex flex-col items-center justify-center text-center">
                  <motion.div
                    animate={
                      isDecompressing 
                        ? { rotate: 360 } 
                        : { scale: 1, rotate: 0 }
                    }
                    transition={
                      isDecompressing 
                        ? { repeat: Infinity, duration: 1, ease: "linear" } 
                        : { type: "spring", stiffness: 300 }
                    }
                    className="mb-6"
                  >
                    <div className="relative">
                      <div className={`absolute inset-0 gradient-primary rounded-full blur-2xl opacity-30 ${isDecompressing ? "" : "animate-pulse-glow"}`} />
                      <div className="relative p-5 rounded-full bg-secondary">
                        {isDecompressing ? (
                          <Loader2 className="w-10 h-10 text-primary" />
                        ) : (
                          <FileDown className="w-10 h-10 text-primary" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2">
                    {isDecompressing 
                      ? `Decompressing... ${formatElapsedTimeShort(decompressElapsedMilliseconds)}` 
                      : "Drop file to decompress"
                    }
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {isDecompressing 
                      ? "Your download will start automatically" 
                      : <>or <span className="text-primary font-medium">click to browse</span></>
                    }
                  </p>
                </div>
              </label>
            </motion.div>
          </section>

          {/* Compression Log */}
          <section aria-labelledby="compression-log-heading">
            <CompressionLog entries={logEntries} onClear={clearLog} />
          </section>
        </motion.main>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 text-sm text-muted-foreground space-y-3"
          aria-label="Footer information"
        >
          <div className="mt-6 text-center">
            <Button
              onClick={() => setCustomDataDialogOpen(true)}
              variant="secondary"
              className="w-full sm:w-auto mx-auto"
            >
              Generate Custom Sized Data
            </Button>
          </div>
          <p>
            All processing happens locally in your browser.{" "}
            <span className="text-primary">Your files never leave your device.</span>
          </p>
          <p>
            Works offline —{" "}
            <a 
              href="https://github.com/pRizz/zeckendorf-webapp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              free &amp; open source
            </a>{" "}
            on GitHub (MIT License)
          </p>
          <p>
            <a 
              href="https://github.com/pRizz/zeckendorf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Free &amp; open source Rust code
            </a>{" "}
            for Zeckendorf Compression and Decompression
          </p>
          <p>
            <a 
              href={MEDIUM_ARTICLE_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Learn about Zeckendorf compression
            </a>
          </p>
          <p className="text-xs">
            Made by{" "}
            <span className="text-foreground">Peter Ryszkiewicz</span>{" "}
            with{" "}
            <a 
              href="https://cursor.sh" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Cursor
            </a>
            {" "}and{" "}
            <a 
              href="https://lovable.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Lovable
            </a>
          </p>
        </motion.footer>
      </div>

      {/* Compression Failure Dialog */}
      <Dialog 
        open={compressionFailureDialog?.open ?? false} 
        onOpenChange={(open) => {
          if (!open) {
            setCompressionFailureDialog(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compression Not Beneficial</DialogTitle>
            <DialogDescription>
              The Zeckendorf compression algorithm did not produce smaller files than the original for both endianness options.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Original file size:</span>
                <span className="text-sm font-mono">{formatBytes(compressionFailureDialog?.originalSize ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Big endian compressed size:</span>
                <span className="text-sm font-mono text-muted-foreground">{formatBytes(compressionFailureDialog?.beSize ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Little endian compressed size:</span>
                <span className="text-sm font-mono text-muted-foreground">{formatBytes(compressionFailureDialog?.leSize ?? 0)}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Zeckendorf compression works best on certain types of data. This file's data distribution doesn't benefit from Zeckendorf compression.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setCompressionFailureDialog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multiple Files Warning Dialog */}
      <Dialog 
        open={multipleFilesWarningDialog?.open ?? false} 
        onOpenChange={(open) => {
          if (!open) {
            setMultipleFilesWarningDialog(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Multiple Files Not Supported</DialogTitle>
            <DialogDescription>
              Processing multiple files at once is not supported. Please process one file at a time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setMultipleFilesWarningDialog(null)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Large File Warning Dialog */}
      <Dialog 
        open={largeFileWarningDialog?.open ?? false} 
        onOpenChange={(open) => {
          if (!open) {
            setLargeFileWarningDialog(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Large File Warning</DialogTitle>
            <DialogDescription>
              The file you selected ({largeFileWarningDialog?.file.name}) is larger than {formatBytes(FILE_SIZE_WARNING_THRESHOLD)} ({formatBytes(largeFileWarningDialog?.file.size ?? 0)}). Processing files larger than this limit may cause high CPU usage, memory issues, or cause your browser tab to lock up.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Do you want to proceed with {largeFileWarningDialog?.action === "compress" ? "compression" : "decompression"} anyway?
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setLargeFileWarningDialog(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (largeFileWarningDialog?.file && largeFileWarningDialog?.action) {
                  if (largeFileWarningDialog.action === "compress") {
                    void proceedWithCompression(largeFileWarningDialog.file);
                  } else {
                    void proceedWithDecompression(largeFileWarningDialog.file);
                  }
                  setLargeFileWarningDialog(null);
                }
              }}
            >
              Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No Files Warning Dialog */}
      <Dialog 
        open={noFilesWarningDialog?.open ?? false} 
        onOpenChange={(open) => {
          if (!open) {
            setNoFilesWarningDialog(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No File Selected</DialogTitle>
            <DialogDescription>
              No file was selected for {noFilesWarningDialog?.action === "compress" ? "compression" : "decompression"}. Please select a file to process.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setNoFilesWarningDialog(null)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Data Generation Dialog */}
      <Dialog 
        open={customDataDialogOpen} 
        onOpenChange={setCustomDataDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Custom Sized Data</DialogTitle>
            <DialogDescription>
              Enter the content size in bytes and choose which file type to generate. Each file is generated on-demand when you click its button. <b>For .zeck files, the total file size will be 10 bytes larger due to the header.</b> A maximum of {MAX_GENERATABLE_FILE_SIZE.toLocaleString()} bytes is set due to memory pressure during compression and decompression. Wanna help improve the algorithm? Check out the <a href="https://github.com/pRizz/zeckendorf" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Rust code</a> and submit a pull request!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="data-size">Content size in bytes (max {MAX_GENERATABLE_FILE_SIZE.toLocaleString()})</Label>
              <Input
                id="data-size"
                type="number"
                min="1"
                max={MAX_GENERATABLE_FILE_SIZE}
                value={customDataContentSize}
                onChange={(e) => {
                  const value = e.target.value;
                  const maybeNum = parseInt(value, 10);
                  if (value === "" || (!isNaN(maybeNum) && maybeNum > 0 && maybeNum <= MAX_GENERATABLE_FILE_SIZE)) {
                    setCustomDataContentSize(value);
                  }
                }}
                placeholder="Enter content size in bytes"
                disabled={generatingType !== null}
              />
              {customDataContentSize && (isNaN(parseInt(customDataContentSize, 10)) || parseInt(customDataContentSize, 10) <= 0 || parseInt(customDataContentSize, 10) > MAX_GENERATABLE_FILE_SIZE) && (
                <p className="text-sm text-destructive">
                  Please enter a number between 1 and {MAX_GENERATABLE_FILE_SIZE.toLocaleString()}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <div className="text-sm font-medium">Well Compressible Data</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    void handleGenerateWellCompressibleBE();
                  }}
                  disabled={generatingType !== null || !customDataContentSize || isNaN(parseInt(customDataContentSize, 10)) || parseInt(customDataContentSize, 10) <= 0 || parseInt(customDataContentSize, 10) > MAX_GENERATABLE_FILE_SIZE}
                  variant="outline"
                  className="w-full"
                >
                  {generatingType === "wellCompressibleBE" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating... {formatElapsedTimeShort(elapsedMilliseconds)}
                    </>
                  ) : (
                    "Well Compressible (BE)"
                  )}
                </Button>
                <Button
                  onClick={() => {
                    void handleGenerateWellCompressibleLE();
                  }}
                  disabled={generatingType !== null || !customDataContentSize || isNaN(parseInt(customDataContentSize, 10)) || parseInt(customDataContentSize, 10) <= 0 || parseInt(customDataContentSize, 10) > MAX_GENERATABLE_FILE_SIZE}
                  variant="outline"
                  className="w-full"
                >
                  {generatingType === "wellCompressibleLE" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating... {formatElapsedTimeShort(elapsedMilliseconds)}
                    </>
                  ) : (
                    "Well Compressible (LE)"
                  )}
                </Button>
              </div>
              <div className="text-sm font-medium mt-4">Compressed Data (.zeck) 
                {validateCustomDataContentSize(false) && <span className="text-xs text-muted-foreground">{" "}(total file size will be {ZECK_FILE_HEADER_SIZE + validateCustomDataContentSize(false)!} bytes)</span>}
                </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    handleGenerateCompressedBE();
                  }}
                  disabled={generatingType !== null || !customDataContentSize || isNaN(parseInt(customDataContentSize, 10)) || parseInt(customDataContentSize, 10) <= 0 || parseInt(customDataContentSize, 10) > MAX_GENERATABLE_FILE_SIZE}
                  variant="outline"
                  className="w-full"
                >
                  {generatingType === "compressedBE" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating... {formatElapsedTimeShort(elapsedMilliseconds)}
                    </>
                  ) : (
                    "Compressed (BE)"
                  )}
                </Button>
                <Button
                  onClick={() => {
                    handleGenerateCompressedLE();
                  }}
                  disabled={generatingType !== null || !customDataContentSize || isNaN(parseInt(customDataContentSize, 10)) || parseInt(customDataContentSize, 10) <= 0 || parseInt(customDataContentSize, 10) > MAX_GENERATABLE_FILE_SIZE}
                  variant="outline"
                  className="w-full"
                >
                  {generatingType === "compressedLE" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating... {formatElapsedTimeShort(elapsedMilliseconds)}
                    </>
                  ) : (
                    "Compressed (LE)"
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCustomDataDialogOpen(false);
                setCustomDataContentSize("");
              }}
              disabled={generatingType !== null}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
