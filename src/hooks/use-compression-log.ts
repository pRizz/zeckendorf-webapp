import { useState, useEffect } from "react";
import type { CompressionLogEntry } from "@/components/CompressionLog";
import { COMPRESSION_LOG_STORAGE_KEY } from "@/lib/constants";

export const useCompressionLog = () => {
  const [logEntries, setLogEntries] = useState<CompressionLogEntry[]>([]);

  // Load log entries from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPRESSION_LOG_STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored) as unknown;
      if (!Array.isArray(parsed)) return;

      // Convert timestamp strings back to Date objects
      const entries = parsed.map((entry: unknown) => {
        if (typeof entry === "object" && entry !== null && "timestamp" in entry) {
          return {
            ...(entry as CompressionLogEntry),
            timestamp: new Date((entry as { timestamp: string | Date }).timestamp),
          };
        }
        return entry as CompressionLogEntry;
      });
      setLogEntries(entries);
    } catch (error) {
      console.error("Failed to load log entries from localStorage:", error);
    }
  }, []);

  // Save log entries to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(COMPRESSION_LOG_STORAGE_KEY, JSON.stringify(logEntries));
    } catch (error) {
      console.error("Failed to save log entries to localStorage:", error);
    }
  }, [logEntries]);

  const clearLog = (): void => {
    setLogEntries([]);
    try {
      localStorage.removeItem(COMPRESSION_LOG_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear log from localStorage:", error);
    }
  };

  return {
    logEntries,
    setLogEntries,
    clearLog,
  };
};

