import { v4 as uuidv4 } from 'uuid'

/**
 * Generate a standard UUID v4
 */
export function generateUuid(): string {
  return uuidv4()
}

/**
 * Generate a URN-formatted UUID (urn:uuid:...)
 */
export function generateUrnUuid(): string {
  return `urn:uuid:${uuidv4()}`
}

/**
 * Check if a string is a valid URN UUID format
 */
export function isValidUrnUuid(value: string): boolean {
  const uuidRegex = /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Check if a string is a valid UUID v4 format
 */
export function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Extract UUID from URN format
 */
export function extractUuidFromUrn(urn: string): string | null {
  const match = urn.match(/urn:uuid:([0-9a-f-]+)$/i)
  return match?.[1] ?? null
}
