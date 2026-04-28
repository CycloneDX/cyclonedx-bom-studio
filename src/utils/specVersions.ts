/**
 * Central source of truth for supported CycloneDX specification versions.
 *
 * BOM Studio currently supports CycloneDX 1.6 and 1.7. CycloneDX 2.0 is in
 * development and is expected to introduce many breaking changes; this module
 * is structured so that 2.0 (or any future major) can be added by extending
 * the SUPPORTED_SPEC_VERSIONS list and bundling the matching schema in
 * src/schemas/. Major version transitions may also require updating gating
 * tables in useSpecVersionGating, since v2.0 is not strictly additive over
 * v1.x.
 */

/**
 * All CycloneDX spec versions BOM Studio can read, edit, validate, and write.
 * Order is significant: latest supported version must be last.
 */
export const SUPPORTED_SPEC_VERSIONS = ['1.6', '1.7'] as const

export type SupportedSpecVersion = typeof SUPPORTED_SPEC_VERSIONS[number]

/** Default spec version used for new BOMs and as a fallback. */
export const DEFAULT_SPEC_VERSION: SupportedSpecVersion = '1.7'

/** Lowest supported spec version. BOMs below this are converted on import. */
export const MINIMUM_SPEC_VERSION: SupportedSpecVersion = '1.6'

/** Returns true if the given value is a spec version BOM Studio supports. */
export function isSupportedSpecVersion(version: unknown): version is SupportedSpecVersion {
  return typeof version === 'string'
    && (SUPPORTED_SPEC_VERSIONS as readonly string[]).includes(version)
}
