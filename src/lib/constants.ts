/**
 * Application constants
 */

export const MEDIUM_ARTICLE_URL = "https://medium.com/p/8713770f5598/";

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
