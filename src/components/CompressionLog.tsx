import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Trash2, FileArchive, Check, X, FileDown, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, formatElapsedTimeLong } from "@/lib/utils";

export interface CompressionLogEntry {
  id: string;
  type: "compress" | "decompress";
  filename: string;
  originalSize: number;
  compressedSize?: number; // Only for compression entries
  decompressedSize?: number; // Only for decompression entries
  compressionType?: string; // Only for compression entries
  compressionLevel?: string; // Only for compression entries
  success: boolean;
  error?: string; // Only for failed entries
  beSize?: number; // Big endian compressed size (for failed compression attempts)
  leSize?: number; // Little endian compressed size (for failed compression attempts)
  elapsedTime?: number; // Elapsed time in milliseconds
  timestamp: Date;
}

interface CompressionLogProps {
  entries: CompressionLogEntry[];
  onClear: () => void;
}

const formatDateTime = (date: Date): string => {
  return date.toLocaleString([], { 
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit", 
    minute: "2-digit" 
  });
};

export const CompressionLog = ({ entries, onClear }: CompressionLogProps): JSX.Element => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl glass border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 flex-1 hover:bg-secondary/50 transition-colors rounded-md -m-2 p-2"
        >
          <div className="p-2 rounded-lg bg-primary/10">
            <FileArchive className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 id="compression-log-heading" className="text-sm font-medium">Compression History</h3>
            <p className="text-xs text-muted-foreground">
              {entries.length === 0 
                ? "No operations yet" 
                : `${entries.length} operation${entries.length !== 1 ? "s" : ""} logged`}
            </p>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground ml-auto" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground ml-auto" />
          )}
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

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
              {entries.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No operations logged yet. Try compressing or decompressing a file to see the history here.
                </div>
              ) : (
                entries.map((entry, index) => {
                const isCompress = entry.type === "compress";
                const isDecompress = entry.type === "decompress";
                const savedPercent = entry.compressedSize 
                  ? ((1 - entry.compressedSize / entry.originalSize) * 100).toFixed(1)
                  : null;
                const isPositive = savedPercent ? parseFloat(savedPercent) > 0 : false;

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
                        <div className={`p-1.5 rounded-md ${
                          entry.success 
                            ? "bg-primary/10" 
                            : "bg-destructive/10"
                        }`}>
                          {entry.success ? (
                            isCompress ? (
                              <FileUp className="w-3 h-3 text-primary" />
                            ) : (
                              <FileDown className="w-3 h-3 text-primary" />
                            )
                          ) : (
                            <X className="w-3 h-3 text-destructive" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold">
                              {entry.success 
                                ? (isCompress ? "Compression Successful" : "Decompression Successful")
                                : (isCompress ? "Compression Failed" : "Decompression Failed")
                              }
                            </p>
                            {entry.success && (
                              <Check className="w-3.5 h-3.5 text-primary" />
                            )}
                          </div>
                          <p className="text-sm font-medium truncate text-muted-foreground">{entry.filename}</p>
                          {entry.success ? (
                            isCompress && entry.compressedSize ? (
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
                                  {Math.abs(parseFloat(savedPercent ?? "0"))}%
                                </span>
                              </div>
                            ) : isDecompress && entry.decompressedSize ? (
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span className="font-mono">{formatBytes(entry.originalSize)}</span>
                                <span>→</span>
                                <span className="font-mono">{formatBytes(entry.decompressedSize)}</span>
                              </div>
                            ) : null
                          ) : (
                            <div className="mt-1 space-y-1">
                              <p className="text-xs text-destructive">
                                {entry.error ?? (isCompress ? "Compression did not reduce file size" : "Decompression failed")}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-mono">{formatBytes(entry.originalSize)}</span>
                                {isCompress && (entry.beSize !== undefined || entry.leSize !== undefined) && (
                                  <>
                                    <span>→</span>
                                    <span className="font-mono text-muted-foreground">
                                      BE: {formatBytes(entry.beSize ?? entry.originalSize)}, LE: {formatBytes(entry.leSize ?? entry.originalSize)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {entry.compressionType && (
                          <span className="inline-block px-2 py-0.5 text-xs font-mono rounded bg-secondary text-secondary-foreground mb-1">
                            {entry.compressionType.toUpperCase()}
                          </span>
                        )}
                        {entry.elapsedTime !== undefined && (
                          <p className="text-xs text-muted-foreground mb-1">
                            Took {formatElapsedTimeLong(entry.elapsedTime)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              }))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
