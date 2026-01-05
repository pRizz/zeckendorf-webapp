import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileArchive } from "lucide-react";
import { CompressionLog } from "@/components/CompressionLog";
import { MEDIUM_ARTICLE_URL } from "@/lib/constants";
import { useCompressionLog } from "@/hooks/use-compression-log";
import { useElapsedTime } from "@/hooks/use-elapsed-time";
import { useDragAndDrop } from "@/hooks/use-drag-and-drop";
import { useFileCompression } from "@/hooks/use-file-compression";
import { useFileDecompression } from "@/hooks/use-file-decompression";
import { useFileGeneration } from "@/hooks/use-file-generation";
import { useFileHandling } from "@/hooks/use-file-handling";
import { CompressSection } from "@/components/CompressSection";
import { DecompressSection } from "@/components/DecompressSection";
import { FooterSection } from "@/components/FooterSection";
import { CompressionFailureDialog } from "@/components/CompressionFailureDialog";
import { MultipleFilesWarningDialog } from "@/components/MultipleFilesWarningDialog";
import { LargeFileWarningDialog } from "@/components/LargeFileWarningDialog";
import { NoFilesWarningDialog } from "@/components/NoFilesWarningDialog";
import { CustomDataGenerationDialog } from "@/components/CustomDataGenerationDialog";

const Index = (): JSX.Element => {
  const { logEntries, setLogEntries, clearLog } = useCompressionLog();
  const { isCompressing, compressionFailureDialog, setCompressionFailureDialog, proceedWithCompression } = useFileCompression(setLogEntries);
  const { isDecompressing, proceedWithDecompression } = useFileDecompression(setLogEntries);
  const {
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
  } = useFileGeneration();
  const {
    multipleFilesWarningDialog,
    setMultipleFilesWarningDialog,
    largeFileWarningDialog,
    setLargeFileWarningDialog,
    noFilesWarningDialog,
    setNoFilesWarningDialog,
    handleFiles,
  } = useFileHandling();

  const compressDragAndDrop = useDragAndDrop();
  const decompressDragAndDrop = useDragAndDrop();

  const compressElapsedMilliseconds = useElapsedTime(isCompressing);
  const decompressElapsedMilliseconds = useElapsedTime(isDecompressing);
  const generationElapsedMilliseconds = useElapsedTime(generatingType !== null);

  const [customDataDialogOpen, setCustomDataDialogOpen] = useState(false);

  const handleCompress = useCallback((filesToCompress: File[]) => {
    handleFiles(filesToCompress, "compress", (file) => {
      void proceedWithCompression(file);
    });
  }, [handleFiles, proceedWithCompression]);

  const handleDecompress = useCallback((filesToDecompress: File[]) => {
    handleFiles(filesToDecompress, "decompress", (file) => {
      void proceedWithDecompression(file);
    });
  }, [handleFiles, proceedWithDecompression]);

  const handleDragCompress = useCallback((e: React.DragEvent) => {
    compressDragAndDrop.handleDrag(e);
  }, [compressDragAndDrop]);

  const handleDragDecompress = useCallback((e: React.DragEvent) => {
    decompressDragAndDrop.handleDrag(e);
  }, [decompressDragAndDrop]);

  const handleDropCompress = useCallback(
    (e: React.DragEvent) => {
      if (isCompressing) return;
      compressDragAndDrop.handleDrop(e, handleCompress);
    },
    [isCompressing, compressDragAndDrop, handleCompress]
  );

  const handleDropDecompress = useCallback(
    (e: React.DragEvent) => {
      if (isDecompressing) return;
      decompressDragAndDrop.handleDrop(e, handleDecompress);
    },
    [isDecompressing, decompressDragAndDrop, handleDecompress]
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
          <CompressSection
            isCompressing={isCompressing}
            isDragActive={compressDragAndDrop.isDragActive}
            elapsedMilliseconds={compressElapsedMilliseconds}
            onDragEnter={handleDragCompress}
            onDragLeave={handleDragCompress}
            onDragOver={handleDragCompress}
            onDrop={handleDropCompress}
            onFileInputChange={handleFileInputCompress}
            onDownloadWellCompressibleBE={handleDownloadWellCompressibleBE}
            onDownloadWellCompressibleLE={handleDownloadWellCompressibleLE}
          />

          {/* Decompress Section */}
          <DecompressSection
            isDecompressing={isDecompressing}
            isDragActive={decompressDragAndDrop.isDragActive}
            elapsedMilliseconds={decompressElapsedMilliseconds}
            onDragEnter={handleDragDecompress}
            onDragLeave={handleDragDecompress}
            onDragOver={handleDragDecompress}
            onDrop={handleDropDecompress}
            onFileInputChange={handleFileInputDecompress}
            onDownloadSampleCompressedFileBE={handleDownloadSampleCompressedFileBE}
            onDownloadSampleCompressedFileLE={handleDownloadSampleCompressedFileLE}
          />

          {/* Compression Log */}
          <section aria-labelledby="compression-log-heading">
            <CompressionLog entries={logEntries} onClear={clearLog} />
          </section>
        </motion.main>

        {/* Footer */}
        <FooterSection onOpenCustomDataDialog={() => setCustomDataDialogOpen(true)} />
      </div>

      {/* Compression Failure Dialog */}
      {compressionFailureDialog && (
        <CompressionFailureDialog
          open={compressionFailureDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setCompressionFailureDialog(null);
            }
          }}
          originalSize={compressionFailureDialog.originalSize}
          beSize={compressionFailureDialog.beSize}
          leSize={compressionFailureDialog.leSize}
        />
      )}

      {/* Multiple Files Warning Dialog */}
      {multipleFilesWarningDialog && (
        <MultipleFilesWarningDialog
          open={multipleFilesWarningDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setMultipleFilesWarningDialog(null);
            }
          }}
        />
      )}

      {/* Large File Warning Dialog */}
      {largeFileWarningDialog && (
        <LargeFileWarningDialog
          open={largeFileWarningDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setLargeFileWarningDialog(null);
            }
          }}
          file={largeFileWarningDialog.file}
          action={largeFileWarningDialog.action}
          onProceed={() => {
            if (largeFileWarningDialog.action === "compress") {
              void proceedWithCompression(largeFileWarningDialog.file);
            } else {
              void proceedWithDecompression(largeFileWarningDialog.file);
            }
            setLargeFileWarningDialog(null);
          }}
        />
      )}

      {/* No Files Warning Dialog */}
      {noFilesWarningDialog && (
        <NoFilesWarningDialog
          open={noFilesWarningDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setNoFilesWarningDialog(null);
            }
          }}
          action={noFilesWarningDialog.action}
        />
      )}

      {/* Custom Data Generation Dialog */}
      <CustomDataGenerationDialog
        open={customDataDialogOpen}
        onOpenChange={setCustomDataDialogOpen}
        customDataContentSize={customDataContentSize}
        onCustomDataContentSizeChange={setCustomDataContentSize}
        generatingType={generatingType}
        elapsedMilliseconds={generationElapsedMilliseconds}
        validateCustomDataContentSize={validateCustomDataContentSize}
        onGenerateWellCompressibleBE={handleGenerateWellCompressibleBE}
        onGenerateWellCompressibleLE={handleGenerateWellCompressibleLE}
        onGenerateCompressedBE={handleGenerateCompressedBE}
        onGenerateCompressedLE={handleGenerateCompressedLE}
      />
    </div>
  );
};

export default Index;
