import { motion } from "framer-motion";
import { Loader2, Upload } from "lucide-react";
import { formatElapsedTimeShort } from "@/lib/utils";

interface CompressSectionProps {
  isCompressing: boolean;
  isDragActive: boolean;
  elapsedMilliseconds: number;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadWellCompressibleBE: () => void;
  onDownloadWellCompressibleLE: () => void;
}

export const CompressSection = ({
  isCompressing,
  isDragActive,
  elapsedMilliseconds,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileInputChange,
  onDownloadWellCompressibleBE,
  onDownloadWellCompressibleLE,
}: CompressSectionProps): JSX.Element => {
  return (
    <section aria-labelledby="compress-heading">
      <h2 id="compress-heading" className="text-2xl font-semibold mb-4">Compress</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Drop a file to compress with Zeckendorf. We'll automatically try both big endian and little endian and use whichever produces a smaller result. The odds of a file being compressed with Zeckendorf are very low, so this is mostly for fun.{" "}
        <button
          onClick={onDownloadWellCompressibleBE}
          className="text-primary hover:underline font-medium"
          type="button"
        >
          Download a well compressible file (big endian)
        </button>
        {" "}or{" "}
        <button
          onClick={onDownloadWellCompressibleLE}
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
            : isDragActive
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 bg-card/50"
          }
        `}
        whileHover={!isCompressing ? { scale: 1.01 } : {}}
        whileTap={!isCompressing ? { scale: 0.99 } : {}}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <label className={`block ${isCompressing ? "cursor-wait" : "cursor-pointer"} p-12`}>
          <input
            type="file"
            onChange={onFileInputChange}
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
                ? `Compressing... ${formatElapsedTimeShort(elapsedMilliseconds)}` 
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
  );
};

