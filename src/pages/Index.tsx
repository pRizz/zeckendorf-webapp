import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { FileArchive, Zap, Shield, Download, Loader2, Upload, FileDown } from "lucide-react";
import { toast } from "sonner";
import { CompressionLog, CompressionLogEntry } from "@/components/CompressionLog";
import { compressFileWithZeckendorf, decompressFileWithZeckendorf, downloadBlob, decompressUint8Array } from "@/lib/compression";
import { formatBytes } from "@/lib/utils";
import { MEDIUM_ARTICLE_URL, MAX_GENERATABLE_FILE_SIZE } from "@/lib/constants";
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

const Index = () => {
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
  const [customDataSize, setCustomDataSize] = useState<string>("");
  const [generatingType, setGeneratingType] = useState<"wellCompressibleBE" | "wellCompressibleLE" | "compressedBE" | "compressedLE" | null>(null);

  const STORAGE_KEY = "zeckendorf_compression_log";

  // Load log entries from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const entries = parsed.map((entry: CompressionLogEntry) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
        setLogEntries(entries);
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

  const handleCompress = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    if (files.length > 1) {
      toast.error("Zeckendorf compression only supports single file compression. Please drop one file at a time.");
      return;
    }

    const file = files[0];
    setIsCompressing(true);

    try {
      const result = await compressFileWithZeckendorf(file, () => {});

      if (result.success) {
        downloadBlob(result.blob, result.filename);
        
        const originalSize = file.size;
        const compressedSize = result.blob.size;
        const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        
        // Add successful compression to log
        const newEntry: CompressionLogEntry = {
          id: crypto.randomUUID(),
          type: "compress",
          filename: file.name,
          originalSize,
          compressedSize,
          compressionType: `zeckendorf_${result.endianness}`,
          compressionLevel: "auto",
          success: true,
          timestamp: new Date(),
        };
        
        setLogEntries(prev => [newEntry, ...prev]);
        toast.success(`Compressed with ${result.endianness === "be" ? "big endian" : "little endian"}. Saved ${ratio}% (${formatBytes(originalSize)} → ${formatBytes(compressedSize)})`);
      } else if (result.success === false) {
        // Log failed compression attempt
        const failedEntry: CompressionLogEntry = {
          id: crypto.randomUUID(),
          type: "compress",
          filename: file.name,
          originalSize: result.originalSize,
          success: false,
          error: "Compression did not reduce file size",
          beSize: result.beSize,
          leSize: result.leSize,
          timestamp: new Date(),
        };
        
        setLogEntries(prev => [failedEntry, ...prev]);
        
        // Show failure dialog
        setCompressionFailureDialog({
          open: true,
          originalSize: result.originalSize,
          beSize: result.beSize,
          leSize: result.leSize,
        });
      }
    } catch (error) {
      console.error("Compression error:", error);
      
      // Log failed compression attempt with error
      const errorEntry: CompressionLogEntry = {
        id: crypto.randomUUID(),
        type: "compress",
        filename: file.name,
        originalSize: file.size,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };
      
      setLogEntries(prev => [errorEntry, ...prev]);
      toast.error("Failed to compress file. Please try again.");
    } finally {
      setIsCompressing(false);
    }
  }, []);

  const handleDecompress = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    if (files.length > 1) {
      toast.error("Please drop one file at a time for decompression.");
      return;
    }

    const file = files[0];
    setIsDecompressing(true);

    try {
      const result = await decompressFileWithZeckendorf(file, () => {});

      if ("error" in result) {
        // Log failed decompression attempt
        const failedEntry: CompressionLogEntry = {
          id: crypto.randomUUID(),
          type: "decompress",
          filename: file.name,
          originalSize: file.size,
          success: false,
          error: result.error,
          timestamp: new Date(),
        };
        
        setLogEntries(prev => [failedEntry, ...prev]);
        toast.error(result.error);
      } else {
        downloadBlob(result.blob, result.filename);
        
        // Log successful decompression
        const successEntry: CompressionLogEntry = {
          id: crypto.randomUUID(),
          type: "decompress",
          filename: file.name,
          originalSize: file.size,
          decompressedSize: result.blob.size,
          success: true,
          timestamp: new Date(),
        };
        
        setLogEntries(prev => [successEntry, ...prev]);
        toast.success(`Decompressed file: ${result.filename}`);
      }
    } catch (error) {
      console.error("Decompression error:", error);
      
      // Log failed decompression attempt with error
      const errorEntry: CompressionLogEntry = {
        id: crypto.randomUUID(),
        type: "decompress",
        filename: file.name,
        originalSize: file.size,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      };
      
      setLogEntries(prev => [errorEntry, ...prev]);
      toast.error("Failed to decompress file. Please try again.");
    } finally {
      setIsDecompressing(false);
    }
  }, []);

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
        handleCompress(droppedFiles);
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
        handleDecompress(droppedFiles);
      }
    },
    [isDecompressing, handleDecompress]
  );

  const handleFileInputCompress = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isCompressing) return;
      
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        handleCompress(selectedFiles);
      }
      e.target.value = "";
    },
    [isCompressing, handleCompress]
  );

  const handleFileInputDecompress = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isDecompressing) return;
      
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        handleDecompress(selectedFiles);
      }
      e.target.value = "";
    },
    [isDecompressing, handleDecompress]
  );

  const clearLog = () => {
    setLogEntries([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear log from localStorage:", error);
    }
  };

  const handleDownloadSampleCompressedFileBE = useCallback(async () => {
    try {
      // Create 100 bytes of 0xFF, which represents an All Ones Zeckendorf Number
      const sampleCompressedData = new Uint8Array(100);
      sampleCompressedData.fill(0xFF);
                  
      // Create blob and download
      const blob = new Blob([sampleCompressedData]);
      downloadBlob(blob, "100bytesCompressed.zbe");
      toast.success("Sample compressed file (big endian) downloaded successfully");
    } catch (error) {
      console.error("Error generating sample file:", error);
      toast.error("Failed to generate sample file");
    }
  }, []);

  const handleDownloadSampleCompressedFileLE = useCallback(async () => {
    try {
      // Create 100 bytes of 0xFF, which represents an All Ones Zeckendorf Number
      const sampleCompressedData = new Uint8Array(100);
      sampleCompressedData.fill(0xFF);
      
      // Create blob and download
      const blob = new Blob([sampleCompressedData]);
      downloadBlob(blob, "100bytesCompressed.zle");
      toast.success("Sample compressed file (little endian) downloaded successfully");
    } catch (error) {
      console.error("Error generating sample file:", error);
      toast.error("Failed to generate sample file");
    }
  }, []);

  const handleDownloadWellCompressibleBE = useCallback(async () => {
    try {
      // Create 100 bytes of 0xFF (compressed representation)
      const compressedData = new Uint8Array(100);
      compressedData.fill(0xFF);
      
      // Decompress using big endian to get the original data that compresses well
      const decompressed = await decompressUint8Array(compressedData, "be");
      
      // Create blob and download
      const blob = new Blob([new Uint8Array(decompressed)]);
      downloadBlob(blob, "wellCompressibleBE.bin");
      toast.success("Well compressible file (big endian) downloaded successfully");
    } catch (error) {
      console.error("Error generating well compressible file:", error);
      toast.error("Failed to generate well compressible file");
    }
  }, []);

  const handleDownloadWellCompressibleLE = useCallback(async () => {
    try {
      // Create 100 bytes of 0xFF (compressed representation)
      const compressedData = new Uint8Array(100);
      compressedData.fill(0xFF);
      
      // Decompress using little endian to get the original data that compresses well
      const decompressed = await decompressUint8Array(compressedData, "le");
      
      // Create blob and download
      const blob = new Blob([new Uint8Array(decompressed)]);
      downloadBlob(blob, "wellCompressibleLE.bin");
      toast.success("Well compressible file (little endian) downloaded successfully");
    } catch (error) {
      console.error("Error generating well compressible file:", error);
      toast.error("Failed to generate well compressible file");
    }
  }, []);

  const validateSize = useCallback((): number | null => {
    const maybeSize = parseInt(customDataSize, 10);
    
    if (isNaN(maybeSize) || maybeSize <= 0) {
      toast.error("Please enter a valid positive number");
      return null;
    }
    
    if (maybeSize > MAX_GENERATABLE_FILE_SIZE) {
      toast.error(`Size must be at most ${MAX_GENERATABLE_FILE_SIZE.toLocaleString()} bytes`);
      return null;
    }

    return maybeSize;
  }, [customDataSize]);

  const handleGenerateWellCompressibleBE = useCallback(async () => {
    const maybeSize = validateSize();
    if (maybeSize === null) return;

    setGeneratingType("wellCompressibleBE");

    try {
      // Generate compressed data of the specified size (filled with 0xFF)
      const compressedData = new Uint8Array(maybeSize);
      compressedData.fill(0xFF);
      
      // Decompress to get the original well compressible data
      const decompressed = await decompressUint8Array(compressedData, "be");
      
      // Download well compressible file
      const blob = new Blob([new Uint8Array(decompressed)]);
      downloadBlob(blob, `wellCompressibleBE_${maybeSize}bytes.bin`);
      
      toast.success(`Generated well compressible file (BE): ${formatBytes(maybeSize)} compressed → ${formatBytes(decompressed.length)} original`);
    } catch (error) {
      console.error("Error generating well compressible file (BE):", error);
      toast.error("Failed to generate well compressible file");
    } finally {
      setGeneratingType(null);
    }
  }, [validateSize]);

  const handleGenerateWellCompressibleLE = useCallback(async () => {
    const maybeSize = validateSize();
    if (maybeSize === null) return;

    setGeneratingType("wellCompressibleLE");

    try {
      // Generate compressed data of the specified size (filled with 0xFF)
      const compressedData = new Uint8Array(maybeSize);
      compressedData.fill(0xFF);
      
      // Decompress to get the original well compressible data
      const decompressed = await decompressUint8Array(compressedData, "le");
      
      // Download well compressible file
      const blob = new Blob([new Uint8Array(decompressed)]);
      downloadBlob(blob, `wellCompressibleLE_${maybeSize}bytes.bin`);
      
      toast.success(`Generated well compressible file (LE): ${formatBytes(maybeSize)} compressed → ${formatBytes(decompressed.length)} original`);
    } catch (error) {
      console.error("Error generating well compressible file (LE):", error);
      toast.error("Failed to generate well compressible file");
    } finally {
      setGeneratingType(null);
    }
  }, [validateSize]);

  const handleGenerateCompressedBE = useCallback(async () => {
    const maybeSize = validateSize();
    if (maybeSize === null) return;

    setGeneratingType("compressedBE");

    try {
      // Generate compressed data of the specified size (filled with 0xFF)
      const compressedData = new Uint8Array(maybeSize);
      compressedData.fill(0xFF);
      
      // Download compressed file
      const blob = new Blob([compressedData]);
      downloadBlob(blob, `compressedBE_${maybeSize}bytes.zbe`);
      
      toast.success(`Generated compressed file (BE): ${formatBytes(maybeSize)}`);
    } catch (error) {
      console.error("Error generating compressed file (BE):", error);
      toast.error("Failed to generate compressed file");
    } finally {
      setGeneratingType(null);
    }
  }, [validateSize]);

  const handleGenerateCompressedLE = useCallback(async () => {
    const maybeSize = validateSize();
    if (maybeSize === null) return;

    setGeneratingType("compressedLE");

    try {
      // Generate compressed data of the specified size (filled with 0xFF)
      const compressedData = new Uint8Array(maybeSize);
      compressedData.fill(0xFF);
      
      // Download compressed file
      const blob = new Blob([compressedData]);
      downloadBlob(blob, `compressedLE_${maybeSize}bytes.zle`);
      
      toast.success(`Generated compressed file (LE): ${formatBytes(maybeSize)}`);
    } catch (error) {
      console.error("Error generating compressed file (LE):", error);
      toast.error("Failed to generate compressed file");
    } finally {
      setGeneratingType(null);
    }
  }, [validateSize]);

  const features = [
    { icon: Zap, label: "Fast", desc: "Browser-powered" },
    { icon: Shield, label: "Private", desc: "No uploads" },
    { icon: Download, label: "Instant", desc: "Auto download" },
  ];

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
                onClick={handleDownloadWellCompressibleBE}
                className="text-primary hover:underline font-medium"
                type="button"
              >
                Download a well compressible file (big endian)
              </button>
              {" "}or{" "}
              <button
                onClick={handleDownloadWellCompressibleLE}
                className="text-primary hover:underline font-medium"
                type="button"
              >
                Download a well compressible file (little endian)
              </button>
              {" "}to try it out.
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
                      ? "Compressing..." 
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
              Drop a compressed file (.zbe or .zle) to decompress. The compression type is detected from the file extension.{" "}
              <button
                onClick={handleDownloadSampleCompressedFileBE}
                className="text-primary hover:underline font-medium"
                type="button"
              >
                Download a sample compressed file (.zbe)
              </button>
              {" "}or{" "}
              <button
                onClick={handleDownloadSampleCompressedFileLE}
                className="text-primary hover:underline font-medium"
                type="button"
              >
                Download a sample compressed file (.zle)
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
                      ? "Decompressing..." 
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

      {/* Custom Data Generation Dialog */}
      <Dialog 
        open={customDataDialogOpen} 
        onOpenChange={setCustomDataDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Custom Sized Data</DialogTitle>
            <DialogDescription>
              Enter the size in bytes and choose which file type to generate. Each file is generated on-demand when you click its button. A maximum of {MAX_GENERATABLE_FILE_SIZE.toLocaleString()} bytes is set due to memory pressure during compression and decompression. Wanna help improve the algorithm? Check out the <a href="https://github.com/pRizz/zeckendorf" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Rust code</a> and submit a pull request!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="data-size">Size in bytes (max {MAX_GENERATABLE_FILE_SIZE.toLocaleString()})</Label>
              <Input
                id="data-size"
                type="number"
                min="1"
                max={MAX_GENERATABLE_FILE_SIZE}
                value={customDataSize}
                onChange={(e) => {
                  const value = e.target.value;
                  const maybeNum = parseInt(value, 10);
                  if (value === "" || (!isNaN(maybeNum) && maybeNum > 0 && maybeNum <= MAX_GENERATABLE_FILE_SIZE)) {
                    setCustomDataSize(value);
                  }
                }}
                placeholder="Enter size in bytes"
                disabled={generatingType !== null}
              />
              {customDataSize && (isNaN(parseInt(customDataSize, 10)) || parseInt(customDataSize, 10) <= 0 || parseInt(customDataSize, 10) > MAX_GENERATABLE_FILE_SIZE) && (
                <p className="text-sm text-destructive">
                  Please enter a number between 1 and {MAX_GENERATABLE_FILE_SIZE.toLocaleString()}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <div className="text-sm font-medium">Well Compressible Data</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={handleGenerateWellCompressibleBE}
                  disabled={generatingType !== null || !customDataSize || isNaN(parseInt(customDataSize, 10)) || parseInt(customDataSize, 10) <= 0 || parseInt(customDataSize, 10) > MAX_GENERATABLE_FILE_SIZE}
                  variant="outline"
                  className="w-full"
                >
                  {generatingType === "wellCompressibleBE" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Well Compressible (BE)"
                  )}
                </Button>
                <Button
                  onClick={handleGenerateWellCompressibleLE}
                  disabled={generatingType !== null || !customDataSize || isNaN(parseInt(customDataSize, 10)) || parseInt(customDataSize, 10) <= 0 || parseInt(customDataSize, 10) > MAX_GENERATABLE_FILE_SIZE}
                  variant="outline"
                  className="w-full"
                >
                  {generatingType === "wellCompressibleLE" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Well Compressible (LE)"
                  )}
                </Button>
              </div>
              <div className="text-sm font-medium mt-4">Compressed Data</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  onClick={handleGenerateCompressedBE}
                  disabled={generatingType !== null || !customDataSize || isNaN(parseInt(customDataSize, 10)) || parseInt(customDataSize, 10) <= 0 || parseInt(customDataSize, 10) > MAX_GENERATABLE_FILE_SIZE}
                  variant="outline"
                  className="w-full"
                >
                  {generatingType === "compressedBE" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Compressed (BE)"
                  )}
                </Button>
                <Button
                  onClick={handleGenerateCompressedLE}
                  disabled={generatingType !== null || !customDataSize || isNaN(parseInt(customDataSize, 10)) || parseInt(customDataSize, 10) <= 0 || parseInt(customDataSize, 10) > MAX_GENERATABLE_FILE_SIZE}
                  variant="outline"
                  className="w-full"
                >
                  {generatingType === "compressedLE" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
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
                setCustomDataSize("");
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
