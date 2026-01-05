import { useState, useCallback } from "react";

/**
 * Analyzes the dataTransfer object to determine what type of content was dropped
 */
const analyzeDroppedContent = (dataTransfer: DataTransfer): string => {
  const types = Array.from(dataTransfer.types);
  const items = Array.from(dataTransfer.items);
  const fileCount = dataTransfer.files.length;

  const analysis: string[] = [];

  if (fileCount > 0) {
    analysis.push(`${fileCount} file(s)`);
  } else {
    analysis.push("0 files");
  }

  if (types.length > 0) {
    analysis.push(`types: [${types.join(", ")}]`);
  }

  if (items.length > 0) {
    const itemTypes = items.map((item) => {
      const kind = item.kind;
      const type = item.type;
      return `${kind}${type ? ` (${type})` : ""}`;
    });
    analysis.push(`items: [${itemTypes.join(", ")}]`);
  }

  // Detect common scenarios
  const hasText = types.some((t) => t.startsWith("text/"));
  const hasHtml = types.includes("text/html");
  const hasUrl = types.includes("text/uri-list") || types.includes("text/x-moz-url");
  const hasImage = types.some((t) => t.startsWith("image/"));
  const hasFiles = types.includes("Files") || fileCount > 0;

  const scenarios: string[] = [];
  if (hasFiles) {
    scenarios.push("file(s)");
  }
  if (hasImage) {
    scenarios.push("image from webpage");
  }
  if (hasHtml) {
    scenarios.push("HTML content");
  }
  if (hasUrl) {
    scenarios.push("URL/link");
  }
  if (hasText && !hasHtml) {
    scenarios.push("plain text");
  }
  if (scenarios.length === 0 && types.length > 0) {
    scenarios.push("unknown content type");
  }

  const result = `Dropped content: ${scenarios.join(", ")}. ${analysis.join(". ")}`;
  return result;
};

export const useDragAndDrop = () => {
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

  const handleDrop = useCallback((e: React.DragEvent, onDrop: (files: File[]) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    
    // Log what was dropped, especially when no files are present
    if (droppedFiles.length === 0) {
      const analysis = analyzeDroppedContent(e.dataTransfer);
      console.warn("Drag and drop: No files detected.", analysis);
    } else {
      const analysis = analyzeDroppedContent(e.dataTransfer);
      console.debug("Drag and drop: Files detected.", analysis);
    }

    onDrop(droppedFiles);
  }, []);

  return {
    isDragActive,
    handleDrag,
    handleDrop,
  };
};

