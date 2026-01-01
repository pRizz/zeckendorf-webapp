import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const formatElapsedTimeShort = (milliseconds: number): string => {
  const seconds = milliseconds / 1000;
  // Truncate milliseconds if time is greater than one second
  if (seconds > 1) {
    return `${seconds.toFixed(0)}s`;
  }
  // Show milliseconds precision for times <= 1 second
  return `${seconds.toFixed(1)}s`;
};

export const formatElapsedTimeLong = (milliseconds: number): string => {
  const seconds = milliseconds / 1000;
  // Always show 3 decimal places
  return `${seconds.toFixed(3)}s`;
};
