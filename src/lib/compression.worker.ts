/// <reference lib="webworker" />

import {
  compress_zeck_best,
  decompress_zeck_file,
  deserialize_zeck_file,
  zeck_file_is_big_endian,
  zeck_file_to_bytes,
  zeck_file_total_size,
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
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
