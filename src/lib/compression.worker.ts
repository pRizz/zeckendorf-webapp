/// <reference lib="webworker" />

import {
  zeckendorf_compress_be,
  zeckendorf_compress_le,
  zeckendorf_decompress_be,
  zeckendorf_decompress_le,
} from "@/../zeckendorf_rs_wasm/zeckendorf_rs.js";
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
  const { id, data, filename } = message;
  const originalSize = data.length;

  sendProgress(id, 30);

  // Try big endian compression first
  const compressedBE = zeckendorf_compress_be(data);
  const beSize = compressedBE.length;

  sendProgress(id, 60);

  // Try little endian compression
  const compressedLE = zeckendorf_compress_le(data);
  const leSize = compressedLE.length;

  sendProgress(id, 90);

  // Check if big endian compression is better
  if (beSize < originalSize) {
    const baseName = filename.replace(/\.[^/.]+$/, "");
    self.postMessage(
      {
        type: "compress",
        id,
        success: true,
        blob: compressedBE,
        filename: `${baseName}.zbe`,
        endianness: "be",
        originalSize,
        compressedSize: beSize,
      } satisfies WorkerResponse,
      [compressedBE.buffer]
    );
    return;
  }

  // Check if little endian compression is better
  if (leSize < originalSize) {
    const baseName = filename.replace(/\.[^/.]+$/, "");
    self.postMessage(
      {
        type: "compress",
        id,
        success: true,
        blob: compressedLE,
        filename: `${baseName}.zle`,
        endianness: "le",
        originalSize,
        compressedSize: leSize,
      } satisfies WorkerResponse,
      [compressedLE.buffer]
    );
    return;
  }

  // Both compressions produced larger files
  self.postMessage({
    type: "compress",
    id,
    success: false,
    originalSize,
    beSize,
    leSize,
  } satisfies WorkerResponse);
};

/**
 * Handles decompression requests
 */
const handleDecompress = (message: Extract<WorkerRequest, { type: "decompress" }>): void => {
  const { id, data, filename } = message;

  sendProgress(id, 30);

  const fileName = filename.toLowerCase();

  // Handle big endian decompression
  if (fileName.endsWith(".zbe")) {
    const decompressed = zeckendorf_decompress_be(data);
    const originalFilename = filename.replace(/\.zbe$/i, "");

    self.postMessage(
      {
        type: "decompress",
        id,
        success: true,
        blob: decompressed,
        filename: originalFilename,
      } satisfies WorkerResponse,
      [decompressed.buffer]
    );
    return;
  }

  // Handle little endian decompression
  if (fileName.endsWith(".zle")) {
    const decompressed = zeckendorf_decompress_le(data);
    const originalFilename = filename.replace(/\.zle$/i, "");

    self.postMessage(
      {
        type: "decompress",
        id,
        success: true,
        blob: decompressed,
        filename: originalFilename,
      } satisfies WorkerResponse,
      [decompressed.buffer]
    );
    return;
  }

  // Unknown compression type
  self.postMessage({
    type: "decompress",
    id,
    success: false,
    error:
      "Could not detect which compression was used. File extension must be .zbe (big endian) or .zle (little endian).",
  } satisfies WorkerResponse);
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
