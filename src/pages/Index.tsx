import { useState } from "react";
import { motion } from "framer-motion";
import { FileArchive, Zap, Shield, Download } from "lucide-react";
import { toast } from "sonner";
import { DropZone } from "@/components/DropZone";
import { CompressionOptions, CompressionFormat, CompressionLevel } from "@/components/CompressionOptions";
import { CompressButton } from "@/components/CompressButton";
import { ProgressBar } from "@/components/ProgressBar";
import { compressFiles, downloadBlob } from "@/lib/compression";

const Index = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<CompressionFormat>("zip");
  const [level, setLevel] = useState<CompressionLevel>("balanced");
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleCompress = async () => {
    if (files.length === 0) {
      toast.error("Please add files to compress");
      return;
    }

    // GZIP and DEFLATE only support single files
    if ((format === "gzip" || format === "deflate") && files.length > 1) {
      toast.error(`${format.toUpperCase()} only supports single file compression. Use ZIP for multiple files.`);
      return;
    }

    setIsCompressing(true);
    setProgress(0);

    try {
      const { blob, filename } = await compressFiles(files, format, level, setProgress);
      downloadBlob(blob, filename);
      
      const originalSize = files.reduce((acc, f) => acc + f.size, 0);
      const compressedSize = blob.size;
      const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      
      toast.success(`Compressed! Saved ${ratio}% (${formatBytes(originalSize)} → ${formatBytes(compressedSize)})`);
      
      // Reset after successful compression
      setFiles([]);
      setProgress(0);
    } catch (error) {
      console.error("Compression error:", error);
      toast.error("Failed to compress files. Please try again.");
    } finally {
      setIsCompressing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

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
            Fast, private file compression directly in your browser. No uploads, no waiting.
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
          <DropZone files={files} onFilesChange={setFiles} />
          
          <CompressionOptions
            format={format}
            level={level}
            onFormatChange={setFormat}
            onLevelChange={setLevel}
          />

          {isCompressing && <ProgressBar progress={progress} />}

          <CompressButton
            disabled={files.length === 0 || isCompressing}
            isCompressing={isCompressing}
            onClick={handleCompress}
          />
        </motion.main>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 text-sm text-muted-foreground"
        >
          <p>
            All processing happens locally in your browser.{" "}
            <span className="text-primary">Your files never leave your device.</span>
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
