import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Trash2, FileArchive, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CompressionLogEntry {
  id: string;
  filename: string;
  originalSize: number;
  compressedSize: number;
  compressionType: string;
  compressionLevel: string;
  timestamp: Date;
}

interface CompressionLogProps {
  entries: CompressionLogEntry[];
  onClear: () => void;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const CompressionLog = ({ entries, onClear }: CompressionLogProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (entries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl glass border border-border overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileArchive className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium">Compression History</h3>
            <p className="text-xs text-muted-foreground">
              {entries.length} file{entries.length !== 1 ? "s" : ""} compressed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-border max-h-64 overflow-y-auto">
              {entries.map((entry, index) => {
                const savedPercent = ((1 - entry.compressedSize / entry.originalSize) * 100).toFixed(1);
                const isPositive = parseFloat(savedPercent) > 0;

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 border-b border-border/50 last:border-b-0 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{entry.filename}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="font-mono">{formatBytes(entry.originalSize)}</span>
                            <span>→</span>
                            <span className="font-mono">{formatBytes(entry.compressedSize)}</span>
                            <span
                              className={`font-semibold ${
                                isPositive ? "text-primary" : "text-muted-foreground"
                              }`}
                            >
                              {isPositive ? "-" : "+"}
                              {Math.abs(parseFloat(savedPercent))}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 py-0.5 text-xs font-mono rounded bg-secondary text-secondary-foreground">
                          {entry.compressionType.toUpperCase()}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
