/**
 * Application constants
 */

export const MEDIUM_ARTICLE_URL = "https://medium.com/p/8713770f5598/";

/**
 * Social media links for Peter Ryszkiewicz
 */
export const LINKEDIN_URL = "https://www.linkedin.com/in/peter-ryszkiewicz/";
export const TWITTER_URL = "https://x.com/pryszkie";
export const GITHUB_URL = "https://github.com/pRizz";
export const MEDIUM_URL = "https://medium.com/@peterryszkiewicz";

/**
 * Maximum generatable file size in bytes.
 * Set due to memory pressure during compression and decompression.
 */
export const MAX_GENERATABLE_FILE_SIZE = 15_000 /* bytes */ ;

export const ZECK_FILE_HEADER_SIZE = 10 /* bytes */ ;

/**
 * File size threshold in bytes for showing a warning dialog.
 * Files larger than this may cause memory issues or browser tab lockup.
 */
export const FILE_SIZE_WARNING_THRESHOLD = 10 * 1024 /* 10KB */ ;

/**
 * Storage key for compression log in localStorage
 */
export const COMPRESSION_LOG_STORAGE_KEY = "zeckendorf_compression_log";

/**
 * Zeckendorf file format flag for big endian
 */
export const ZECK_FLAG_BIG_ENDIAN = 0x01;
