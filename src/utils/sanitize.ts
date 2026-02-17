/**
 * Input sanitization utilities for OWASP best practices.
 * Provides trimming, whitespace-only rejection, length limits,
 * and filename sanitization for CycloneDX BOM Studio.
 */

/** Maximum string length for general text fields */
const MAX_STRING_LENGTH = 10000

/** Maximum string length for URL fields */
const MAX_URL_LENGTH = 2083

/** Maximum file size for BOM imports (10 MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/** Maximum number of components in a BOM */
export const MAX_COMPONENT_COUNT = 50000

/**
 * Trim whitespace from a string. Returns empty string for non-string inputs.
 */
export function trimString(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim()
}

/**
 * Sanitize a required string field: trims whitespace and rejects
 * whitespace-only or empty values.
 * Returns the trimmed value or null if the value is effectively empty.
 */
export function sanitizeRequired(value: unknown): string | null {
  const trimmed = trimString(value)
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Sanitize an optional string field: trims whitespace.
 * Returns trimmed value (may be empty string).
 */
export function sanitizeOptional(value: unknown): string {
  return trimString(value)
}

/**
 * Enforce a maximum length on a string, truncating if necessary.
 */
export function enforceMaxLength(value: string, maxLength: number = MAX_STRING_LENGTH): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value
}

/**
 * Sanitize and validate a URL string.
 * Trims whitespace, enforces length limit, and validates the protocol.
 */
export function sanitizeUrl(value: unknown): string {
  const trimmed = trimString(value)
  if (!trimmed) return ''

  const truncated = enforceMaxLength(trimmed, MAX_URL_LENGTH)

  // Only allow safe URL protocols
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'urn:']
  try {
    const url = new URL(truncated)
    if (!allowedProtocols.includes(url.protocol)) return ''
    return truncated
  } catch {
    // Allow URN-style identifiers (e.g., "urn:uuid:...")
    if (truncated.startsWith('urn:')) return truncated
    return ''
  }
}

/**
 * Sanitize a filename for safe download.
 * Removes path traversal characters, null bytes, and special chars.
 * Enforces a reasonable length limit.
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'bom-export'
  }

  let sanitized = filename
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove path separators
    .replace(/[/\\]/g, '')
    // Remove potentially dangerous characters
    .replace(/[<>:"|?*]/g, '')
    // Remove leading/trailing dots and spaces
    .replace(/^[\s.]+|[\s.]+$/g, '')
    // Collapse multiple spaces or dots
    .replace(/\.{2,}/g, '.')
    .replace(/\s{2,}/g, ' ')

  // Enforce length limit (255 chars is a common filesystem limit)
  if (sanitized.length > 200) {
    const ext = sanitized.lastIndexOf('.')
    if (ext > 0) {
      const extension = sanitized.slice(ext)
      sanitized = sanitized.slice(0, 200 - extension.length) + extension
    } else {
      sanitized = sanitized.slice(0, 200)
    }
  }

  return sanitized || 'bom-export'
}

/**
 * Deep-trim all string values in an object.
 * Recursively traverses objects and arrays.
 */
export function deepTrimStrings(obj: any): any {
  if (typeof obj === 'string') return obj.trim()
  if (Array.isArray(obj)) return obj.map(deepTrimStrings)
  if (obj && typeof obj === 'object') {
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deepTrimStrings(value)
    }
    return result
  }
  return obj
}

/**
 * Validate that a value is a safe integer within bounds.
 */
export function sanitizeInteger(value: unknown, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const int = Math.floor(value)
  if (int < min || int > max) return null
  return int
}

/**
 * Validate spec version is a known value.
 */
export function isValidSpecVersion(version: unknown): boolean {
  const allowed = ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7']
  return typeof version === 'string' && allowed.includes(version)
}

/**
 * Escape HTML entities to prevent XSS in rendered content.
 */
export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return String(str).replace(/[&<>"'/]/g, (c) => map[c] || c)
}
