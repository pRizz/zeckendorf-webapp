import { useState, useCallback } from "react";
import { FILE_SIZE_WARNING_THRESHOLD } from "@/lib/constants";

interface MultipleFilesWarningDialog {
  open: boolean;
  action: "compress" | "decompress";
}

interface LargeFileWarningDialog {
  open: boolean;
  file: File;
  action: "compress" | "decompress";
}

interface NoFilesWarningDialog {
  open: boolean;
  action: "compress" | "decompress";
}

export const useFileHandling = () => {
  const [multipleFilesWarningDialog, setMultipleFilesWarningDialog] = useState<MultipleFilesWarningDialog | null>(null);
  const [largeFileWarningDialog, setLargeFileWarningDialog] = useState<LargeFileWarningDialog | null>(null);
  const [noFilesWarningDialog, setNoFilesWarningDialog] = useState<NoFilesWarningDialog | null>(null);

  const handleFiles = useCallback((
    files: File[],
    action: "compress" | "decompress",
    onProceed: (file: File) => void
  ) => {
    if (files.length === 0) {
      setNoFilesWarningDialog({
        open: true,
        action,
      });
      return;
    }

    if (files.length > 1) {
      setMultipleFilesWarningDialog({
        open: true,
        action,
      });
      return;
    }

    const maybeFirstFile = files[0];
    if (!maybeFirstFile) return;
    const file = maybeFirstFile;

    // Check file size and show warning if larger than threshold
    if (file.size > FILE_SIZE_WARNING_THRESHOLD) {
      setLargeFileWarningDialog({
        open: true,
        file,
        action,
      });
      return;
    }

    onProceed(file);
  }, []);

  return {
    multipleFilesWarningDialog,
    setMultipleFilesWarningDialog,
    largeFileWarningDialog,
    setLargeFileWarningDialog,
    noFilesWarningDialog,
    setNoFilesWarningDialog,
    handleFiles,
  };
};

