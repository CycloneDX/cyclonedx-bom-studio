/**
 * Composable for gating CycloneDX features based on the current BOM spec version.
 *
 * CycloneDX version changelog (features relevant to this app):
 *
 * v1.4 (baseline)
 *   - Components, Services, Dependencies, Vulnerabilities, External References, Compositions, Annotations, Properties
 *   - Component types: application, framework, library, container, operating-system, device, firmware, file
 *   - 16 external reference types
 *
 * v1.5
 *   - Root-level formulation support
 *   - +4 component types: platform, device-driver, machine-learning-model, data
 *   - +23 external reference types (distribution-intake, source-distribution, security-contact, model-card,
 *     log, configuration, evidence, formulation, attestation, threat-model, adversary-model, risk-assessment,
 *     vulnerability-assertion, exploitability-statement, pentest-report, static-analysis-report,
 *     dynamic-analysis-report, runtime-analysis-report, component-analysis-report, maturity-report,
 *     certification-report, codified-infrastructure, quality-metrics, poam)
 *
 * v1.6
 *   - +1 component type: cryptographic-asset
 *   - +3 external reference types: electronic-signature, digital-signature, rfc-9116
 *
 * v1.7
 *   - Citations (new root-level field for data attribution)
 *   - Declarations (new root-level field)
 *   - +4 external reference types: patent, patent-family, patent-assertion, citation
 */
import { computed } from 'vue'
import { useBomStore } from '@/stores/bomStore'

// Semver-like comparison for CycloneDX spec versions (e.g. "1.4", "1.7")
// Handles both string and numeric specVersion values (some BOMs use numbers)
function versionAtLeast(current: string | number, minimum: string | number): boolean {
  const curStr = String(current || '1.4')
  const minStr = String(minimum || '1.4')
  const curParts = curStr.split('.').map(Number)
  const minParts = minStr.split('.').map(Number)
  const curMajor = curParts[0] ?? 0
  const curMinor = curParts[1] ?? 0
  const minMajor = minParts[0] ?? 0
  const minMinor = minParts[1] ?? 0
  if (isNaN(curMajor) || isNaN(curMinor)) return true // Permissive fallback
  if (isNaN(minMajor) || isNaN(minMinor)) return true
  if (curMajor > minMajor) return true
  if (curMajor < minMajor) return false
  return curMinor >= minMinor
}

// ─── Component types by minimum version ───
const COMPONENT_TYPES_BY_VERSION: Array<{ value: string; i18nKey: string; minVersion: string }> = [
  // v1.4 (baseline)
  { value: 'application', i18nKey: 'component.types.application', minVersion: '1.4' },
  { value: 'framework', i18nKey: 'component.types.framework', minVersion: '1.4' },
  { value: 'library', i18nKey: 'component.types.library', minVersion: '1.4' },
  { value: 'container', i18nKey: 'component.types.container', minVersion: '1.4' },
  { value: 'operating-system', i18nKey: 'component.types.operatingSystem', minVersion: '1.4' },
  { value: 'device', i18nKey: 'component.types.device', minVersion: '1.4' },
  { value: 'firmware', i18nKey: 'component.types.firmware', minVersion: '1.4' },
  { value: 'file', i18nKey: 'component.types.file', minVersion: '1.4' },
  // v1.5
  { value: 'platform', i18nKey: 'component.types.platform', minVersion: '1.5' },
  { value: 'device-driver', i18nKey: 'component.types.deviceDriver', minVersion: '1.5' },
  { value: 'machine-learning-model', i18nKey: 'component.types.machineLearningModel', minVersion: '1.5' },
  { value: 'data', i18nKey: 'component.types.data', minVersion: '1.5' },
  // v1.6
  { value: 'cryptographic-asset', i18nKey: 'component.types.cryptographicAsset', minVersion: '1.6' },
]

// ─── External reference types by minimum version ───
const EXT_REF_TYPES_BY_VERSION: Array<{ value: string; minVersion: string }> = [
  // v1.4
  { value: 'vcs', minVersion: '1.4' },
  { value: 'issue-tracker', minVersion: '1.4' },
  { value: 'website', minVersion: '1.4' },
  { value: 'advisories', minVersion: '1.4' },
  { value: 'bom', minVersion: '1.4' },
  { value: 'mailing-list', minVersion: '1.4' },
  { value: 'social', minVersion: '1.4' },
  { value: 'chat', minVersion: '1.4' },
  { value: 'documentation', minVersion: '1.4' },
  { value: 'support', minVersion: '1.4' },
  { value: 'distribution', minVersion: '1.4' },
  { value: 'license', minVersion: '1.4' },
  { value: 'build-meta', minVersion: '1.4' },
  { value: 'build-system', minVersion: '1.4' },
  { value: 'release-notes', minVersion: '1.4' },
  { value: 'other', minVersion: '1.4' },
  // v1.5
  { value: 'distribution-intake', minVersion: '1.5' },
  { value: 'source-distribution', minVersion: '1.5' },
  { value: 'security-contact', minVersion: '1.5' },
  { value: 'model-card', minVersion: '1.5' },
  { value: 'log', minVersion: '1.5' },
  { value: 'configuration', minVersion: '1.5' },
  { value: 'evidence', minVersion: '1.5' },
  { value: 'formulation', minVersion: '1.5' },
  { value: 'attestation', minVersion: '1.5' },
  { value: 'threat-model', minVersion: '1.5' },
  { value: 'adversary-model', minVersion: '1.5' },
  { value: 'risk-assessment', minVersion: '1.5' },
  { value: 'vulnerability-assertion', minVersion: '1.5' },
  { value: 'exploitability-statement', minVersion: '1.5' },
  { value: 'pentest-report', minVersion: '1.5' },
  { value: 'static-analysis-report', minVersion: '1.5' },
  { value: 'dynamic-analysis-report', minVersion: '1.5' },
  { value: 'runtime-analysis-report', minVersion: '1.5' },
  { value: 'component-analysis-report', minVersion: '1.5' },
  { value: 'maturity-report', minVersion: '1.5' },
  { value: 'certification-report', minVersion: '1.5' },
  { value: 'codified-infrastructure', minVersion: '1.5' },
  { value: 'quality-metrics', minVersion: '1.5' },
  { value: 'poam', minVersion: '1.5' },
  // v1.6
  { value: 'electronic-signature', minVersion: '1.6' },
  { value: 'digital-signature', minVersion: '1.6' },
  { value: 'rfc-9116', minVersion: '1.6' },
  // v1.7
  { value: 'patent', minVersion: '1.7' },
  { value: 'patent-family', minVersion: '1.7' },
  { value: 'patent-assertion', minVersion: '1.7' },
  { value: 'citation', minVersion: '1.7' },
]

// ─── Root-level feature availability ───
interface FeatureGate {
  key: string
  minVersion: string
}

const ROOT_FEATURES: FeatureGate[] = [
  { key: 'formulation', minVersion: '1.5' },
  { key: 'citations', minVersion: '1.7' },
  { key: 'declarations', minVersion: '1.7' },
]

export function useSpecVersionGating() {
  const bomStore = useBomStore()

  const specVersion = computed(() => String(bomStore.bom.specVersion || '1.7'))

  /** Check if a specific spec version is supported */
  const isVersionAtLeast = (minVersion: string): boolean =>
    versionAtLeast(specVersion.value, minVersion)

  /** Component types available for the current spec version */
  const availableComponentTypes = computed(() =>
    COMPONENT_TYPES_BY_VERSION.filter(t => versionAtLeast(specVersion.value, t.minVersion))
  )

  /** External reference types available for the current spec version */
  const availableExtRefTypes = computed(() =>
    EXT_REF_TYPES_BY_VERSION
      .filter(t => versionAtLeast(specVersion.value, t.minVersion))
      .map(t => t.value)
  )

  /** Whether citations feature is supported */
  const supportsCitations = computed(() => versionAtLeast(specVersion.value, '1.7'))

  /** Whether declarations feature is supported */
  const supportsDeclarations = computed(() => versionAtLeast(specVersion.value, '1.7'))

  /** Whether formulation root-level feature is supported */
  const supportsFormulation = computed(() => versionAtLeast(specVersion.value, '1.5'))

  /** Whether cryptographic-asset component type is supported (v1.6+) */
  const supportsCryptoAssets = computed(() => versionAtLeast(specVersion.value, '1.6'))

  /** Whether ML model / data component types are supported (v1.5+) */
  const supportsMLAndDataTypes = computed(() => versionAtLeast(specVersion.value, '1.5'))

  /** Formatted version label */
  const versionLabel = computed(() => `CycloneDX ${specVersion.value}`)

  /** Get a human-readable label explaining why a feature is unavailable */
  const featureUnavailableMessage = (featureName: string, minVersion: string): string =>
    `${featureName} requires CycloneDX ${minVersion} or later. Current BOM version: ${specVersion.value}`

  return {
    specVersion,
    isVersionAtLeast,
    availableComponentTypes,
    availableExtRefTypes,
    supportsCitations,
    supportsDeclarations,
    supportsFormulation,
    supportsCryptoAssets,
    supportsMLAndDataTypes,
    versionLabel,
    featureUnavailableMessage
  }
}

export { versionAtLeast, COMPONENT_TYPES_BY_VERSION, EXT_REF_TYPES_BY_VERSION }
