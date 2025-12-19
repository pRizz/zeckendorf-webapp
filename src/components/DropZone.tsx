import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileArchive, X } from "lucide-react";

interface DropZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export const DropZone = ({ files, onFilesChange }: DropZoneProps) => {
  const [isDragActive, setIsDragActive] = useState(false);

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

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        onFilesChange([...files, ...droppedFiles]);
      }
    },
    [files, onFilesChange]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        onFilesChange([...files, ...selectedFiles]);
      }
    },
    [files, onFilesChange]
  );

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <motion.div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative overflow-hidden rounded-2xl border-2 border-dashed 
          transition-all duration-300 cursor-pointer
          ${isDragActive 
            ? "drop-zone-active border-primary" 
            : "border-border hover:border-primary/50 bg-card/50"
          }
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <label className="block cursor-pointer p-12">
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center text-center">
            <motion.div
              animate={isDragActive ? { scale: 1.2, rotate: 10 } : { scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 gradient-primary rounded-full blur-2xl opacity-30 animate-pulse-glow" />
                <div className="relative p-5 rounded-full bg-secondary">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
              </div>
            </motion.div>
            <h3 className="text-xl font-semibold mb-2">
              {isDragActive ? "Drop files here" : "Drag & drop files"}
            </h3>
            <p className="text-muted-foreground text-sm">
              or <span className="text-primary font-medium">browse</span> to select files
            </p>
          </div>
        </label>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-20 h-20 gradient-primary rounded-full blur-3xl opacity-10 animate-spin-slow" />
        <div className="absolute bottom-4 left-4 w-16 h-16 gradient-primary rounded-full blur-2xl opacity-10 animate-float" />
      </motion.div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-md bg-primary/10">
                    <FileArchive className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all"
                >
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
