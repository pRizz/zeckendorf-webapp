/// <reference lib="webworker" />

import {
  compress_zeck_best,
  decompress_zeck_file,
  deserialize_zeck_file,
  zeck_file_is_big_endian,
  zeck_file_to_bytes,
  zeck_file_total_size,
  type ZeckFormatError,
} from "@/../zeckendorf_rs_wasm/zeck.js";
import type { WorkerRequest, WorkerResponse } from "./compression.types";

// TypeScript worker context - self is available in worker scope

/**
 * Sends a progress update message to the main thread
 */
const sendProgress = (id: string, progress: number): void => {
  self.postMessage({
    type: "progress",
    id,
    progress,
  } satisfies WorkerResponse);
};

/**
 * Sends an error message to the main thread
 */
const sendError = (id: string, error: string): void => {
  self.postMessage({
    type: "error",
    id,
    error,
  } satisfies WorkerResponse);
};

/**
 * Checks if an error is a ZeckFormatError and formats a user-friendly error message
 */
const formatZeckFormatError = (maybeError: unknown): string | null => {
  if (
    typeof maybeError !== "object" ||
    maybeError === null ||
    !("HeaderTooShort" in maybeError || "UnsupportedVersion" in maybeError || "ReservedFlagsSet" in maybeError || "CompressionFailed" in maybeError || "DecompressedTooLarge" in maybeError || "DataSizeTooLarge" in maybeError)
  ) {
    return null;
  }

  const error = maybeError as ZeckFormatError;

  if ("HeaderTooShort" in error) {
    const { actual_length, required_length } = error.HeaderTooShort;
    return `Invalid .zeck file header: header is too short (actual: ${actual_length} bytes, required: ${required_length} bytes)`;
  }

  if ("UnsupportedVersion" in error) {
    const { found_version, supported_version } = error.UnsupportedVersion;
    return `Unsupported .zeck file version: found version ${found_version}, but only version ${supported_version} is supported`;
  }

  if ("ReservedFlagsSet" in error) {
    const { flags } = error.ReservedFlagsSet;
    return `Invalid .zeck file: reserved flags are set (flags: 0x${flags.toString(16)})`;
  }

  if ("CompressionFailed" in error) {
    const { original_size, be_size, le_size } = error.CompressionFailed;
    return `Compression failed: original size ${original_size} bytes, big endian size ${be_size} bytes, little endian size ${le_size} bytes`;
  }

  if ("DecompressedTooLarge" in error) {
    const { expected_size, actual_size } = error.DecompressedTooLarge;
    return `Decompression error: decompressed data is too large (expected: ${expected_size} bytes, actual: ${actual_size} bytes)`;
  }

  if ("DataSizeTooLarge" in error) {
    const { size } = error.DataSizeTooLarge;
    return `Data size too large: ${size} bytes exceeds the maximum supported size`;
  }

  return null;
};

/**
 * Handles compression requests
 */
const handleCompress = (message: Extract<WorkerRequest, { type: "compress" }>): void => {
  const { id, dataToCompress: originalData, filename } = message;
  const originalSize = originalData.length;

  sendProgress(id, 30);

  const bestCompressionResult = compress_zeck_best(originalData);

  sendProgress(id, 90);

  if ("BigEndianBest" in bestCompressionResult) {
    const { zeck_file } = bestCompressionResult.BigEndianBest;
    const totalFileSize = zeck_file_total_size(zeck_file);
    const compressedContentSize = zeck_file.compressed_data.length;
    const serializedZeckFile = zeck_file_to_bytes(zeck_file);
    const endianness = zeck_file_is_big_endian(zeck_file) ? "be" : "le";
    self.postMessage(
      {
        type: "compress",
        id,
        success: true,
        compressedData: serializedZeckFile,
        filename: `${filename}.zeck`,
        endianness,
        originalSize,
        compressedContentSize,
        totalFileSize,
      } satisfies WorkerResponse,
      [serializedZeckFile.buffer]
    );
    return;
  }

  if ("LittleEndianBest" in bestCompressionResult) {
    const { zeck_file } = bestCompressionResult.LittleEndianBest;
    const totalFileSize = zeck_file_total_size(zeck_file);
    const compressedContentSize = zeck_file.compressed_data.length;
    const serializedZeckFile = zeck_file_to_bytes(zeck_file);
    const endianness = zeck_file_is_big_endian(zeck_file) ? "be" : "le";
    self.postMessage(
      {
        type: "compress",
        id,
        success: true,
        compressedData: serializedZeckFile,
        filename: `${filename}.zeck`,
        endianness,
        originalSize,
        compressedContentSize,
        totalFileSize,
      } satisfies WorkerResponse,
      [serializedZeckFile.buffer]
    );
    return;
  }

  // Neither compression produced a smaller file
  const { be_size, le_size } = bestCompressionResult.Neither;

  self.postMessage({
    type: "compress",
    id,
    success: false,
    originalSize,
    beSize: be_size,
    leSize: le_size,
  } satisfies WorkerResponse);
};

/**
 * Handles decompression requests
 */
const handleDecompress = (message: Extract<WorkerRequest, { type: "decompress" }>): void => {
  const { id, zeckFileData, filename } = message;

  sendProgress(id, 30);

  const fileName = filename.toLowerCase();

  // FIXME: we probably don't need to check that the file ends in .zeck. A user could just change a random file's extension to .zeck and it would pass this check anyways.
  if (!fileName.endsWith(".zeck")) {
    self.postMessage({
      type: "decompress",
      id,
      success: false,
      error:
        "Could not detect which compression was used. File extension must be .zeck.",
    } satisfies WorkerResponse);
    return;
  }

  try {
    // Deserialize the ZeckFile from bytes
    const zeckFile = deserialize_zeck_file(zeckFileData);
    const compressedContentSize = zeckFile.compressed_data.length;
    const totalFileSize = zeck_file_total_size(zeckFile);
    
    sendProgress(id, 60);

    // Decompress the ZeckFile
    const decompressedData = decompress_zeck_file(zeckFile);
    const originalFilename = filename.replace(/\.zeck$/i, "");

    sendProgress(id, 90);

    self.postMessage(
      {
        type: "decompress",
        id,
        success: true,
        decompressedData,
        filename: originalFilename,
        compressedContentSize,
        totalFileSize,
      } satisfies WorkerResponse,
      [decompressedData.buffer]
    );
  } catch (error) {
    console.error("Decompression error:", error);
    const zeckFormatErrorMessage = formatZeckFormatError(error);
    const errorMessage = zeckFormatErrorMessage ?? (error instanceof Error ? error.message : "Unknown error");
    self.postMessage({
      type: "decompress",
      id,
      success: false,
      error: `Failed to decompress .zeck file: ${errorMessage}`,
    } satisfies WorkerResponse);
  }
};

// Handle messages from the main thread
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;

  try {
    if (message.type === "compress") {
      handleCompress(message);
      return;
    }

    if (message.type === "decompress") {
      handleDecompress(message);
      return;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Worker error:", errorMessage, error);
    sendError(message.id, errorMessage);
  }
};
