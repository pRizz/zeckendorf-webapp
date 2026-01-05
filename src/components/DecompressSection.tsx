import { motion } from "framer-motion";
import { Loader2, FileDown } from "lucide-react";
import { formatElapsedTimeShort } from "@/lib/utils";

interface DecompressSectionProps {
  isDecompressing: boolean;
  isDragActive: boolean;
  elapsedMilliseconds: number;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadSampleCompressedFileBE: () => void;
  onDownloadSampleCompressedFileLE: () => void;
}

export const DecompressSection = ({
  isDecompressing,
  isDragActive,
  elapsedMilliseconds,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileInputChange,
  onDownloadSampleCompressedFileBE,
  onDownloadSampleCompressedFileLE,
}: DecompressSectionProps): JSX.Element => {
  return (
    <section aria-labelledby="decompress-heading">
      <h2 id="decompress-heading" className="text-2xl font-semibold mb-4">Decompress</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Drop a compressed file (.zeck) to decompress.{" "}
        <button
          onClick={onDownloadSampleCompressedFileBE}
          className="text-primary hover:underline font-medium"
          type="button"
        >
          Download a sample compressed file (.zeck, BE)
        </button>
        {" "}or{" "}
        <button
          onClick={onDownloadSampleCompressedFileLE}
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
            : isDragActive
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 bg-card/50"
          }
        `}
        whileHover={!isDecompressing ? { scale: 1.01 } : {}}
        whileTap={!isDecompressing ? { scale: 0.99 } : {}}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <label className={`block ${isDecompressing ? "cursor-wait" : "cursor-pointer"} p-12`}>
          <input
            type="file"
            onChange={onFileInputChange}
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
                ? `Decompressing... ${formatElapsedTimeShort(elapsedMilliseconds)}` 
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
  );
};

