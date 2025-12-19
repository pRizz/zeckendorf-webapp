import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileArchive, Zap, Shield, Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { CompressionOptions, CompressionFormat } from "@/components/CompressionOptions";
import { CompressionLog, CompressionLogEntry } from "@/components/CompressionLog";
import { compressFiles, downloadBlob } from "@/lib/compression";

const Index = () => {
  const [format, setFormat] = useState<CompressionFormat>("zip");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [logEntries, setLogEntries] = useState<CompressionLogEntry[]>([]);
  const level = "balanced";

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleCompress = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    // Check format compatibility
    if ((format === "gzip" || format === "deflate") && files.length > 1) {
      toast.error(`${format.toUpperCase()} only supports single file compression. Use ZIP for multiple files.`);
      return;
    }

    setIsCompressing(true);

    try {
      const { blob, filename } = await compressFiles(files, format, level, () => {});
      downloadBlob(blob, filename);
      
      const originalSize = files.reduce((acc, f) => acc + f.size, 0);
      const compressedSize = blob.size;
      const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      
      // Add to log
      const newEntry: CompressionLogEntry = {
        id: crypto.randomUUID(),
        filename: files.length === 1 ? files[0].name : `${files.length} files`,
        originalSize,
        compressedSize,
        compressionType: format,
        compressionLevel: level,
        timestamp: new Date(),
      };
      
      setLogEntries(prev => [newEntry, ...prev]);
      toast.success(`Saved ${ratio}% (${formatBytes(originalSize)} → ${formatBytes(compressedSize)})`);
    } catch (error) {
      console.error("Compression error:", error);
      toast.error("Failed to compress files. Please try again.");
    } finally {
      setIsCompressing(false);
    }
  }, [format, level]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (isCompressing) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        handleCompress(droppedFiles);
      }
    },
    [isCompressing, handleCompress]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isCompressing) return;
      
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        handleCompress(selectedFiles);
      }
      // Reset input so the same file can be selected again
      e.target.value = "";
    },
    [isCompressing, handleCompress]
  );

  const clearLog = () => {
    setLogEntries([]);
  };

  const features = [
    { icon: Zap, label: "Fast", desc: "Browser-powered" },
    { icon: Shield, label: "Private", desc: "No uploads" },
    { icon: Download, label: "Instant", desc: "Auto download" },
  ];

  return (
    <div 
      className={`min-h-screen bg-background relative overflow-hidden transition-all duration-300 ${
        isDragActive ? "ring-4 ring-inset ring-primary/50 bg-primary/5" : ""
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Full-screen drop overlay */}
      {isDragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none"
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="inline-flex items-center justify-center p-6 rounded-3xl bg-primary/20 border-2 border-dashed border-primary mb-4"
            >
              <Upload className="w-16 h-16 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold text-primary">Drop files to compress</h2>
            <p className="text-muted-foreground mt-2">Release to start compression</p>
          </div>
        </motion.div>
      )}

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 gradient-primary rounded-full blur-[128px] opacity-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 gradient-primary rounded-full blur-[128px] opacity-10" />
      </div>

      <div className="relative z-10 container max-w-2xl mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center justify-center p-4 rounded-2xl bg-secondary/50 border border-border mb-6"
          >
            <FileArchive className="w-10 h-10 text-primary" />
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            <span className="text-gradient">Compress</span> Files
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Drop files to instantly compress. No uploads, no waiting.
          </p>

          {/* Features */}
          <div className="flex justify-center gap-6 mt-8">
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
          </div>
        </motion.header>

        {/* Main content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Compression Options */}
          <CompressionOptions
            format={format}
            onFormatChange={setFormat}
          />

          {/* Drop Zone */}
          <motion.div
            className={`
              relative overflow-hidden rounded-2xl border-2 border-dashed 
              transition-all duration-300 cursor-pointer
              ${isCompressing 
                ? "border-primary/50 bg-primary/5 cursor-wait" 
                : "border-border hover:border-primary/50 bg-card/50"
              }
            `}
            whileHover={!isCompressing ? { scale: 1.01 } : {}}
            whileTap={!isCompressing ? { scale: 0.99 } : {}}
          >
            <label className={`block ${isCompressing ? "cursor-wait" : "cursor-pointer"} p-12`}>
              <input
                type="file"
                multiple
                onChange={handleFileInput}
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
                    : "Drop files anywhere to compress"
                  }
                </h3>
                <p className="text-muted-foreground text-sm">
                  {isCompressing 
                    ? "Your download will start automatically" 
                    : <>or <span className="text-primary font-medium">click to browse</span></>
                  }
                </p>
              </div>
            </label>

            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-20 h-20 gradient-primary rounded-full blur-3xl opacity-10 animate-spin-slow" />
            <div className="absolute bottom-4 left-4 w-16 h-16 gradient-primary rounded-full blur-2xl opacity-10 animate-float" />
          </motion.div>

          {/* Compression Log */}
          <CompressionLog entries={logEntries} onClear={clearLog} />
        </motion.main>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 text-sm text-muted-foreground space-y-3"
        >
          <p>
            All processing happens locally in your browser.{" "}
            <span className="text-primary">Your files never leave your device.</span>
          </p>
          <p>
            Works offline —{" "}
            <a 
              href="https://github.com/pRizz/zip-it-up" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              free &amp; open source
            </a>{" "}
            on GitHub (MIT License)
          </p>
          <p className="text-xs">
            Made by{" "}
            <span className="text-foreground">Peter Ryszkiewicz</span>{" "}
            with{" "}
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
    </div>
  );
};

export default Index;
