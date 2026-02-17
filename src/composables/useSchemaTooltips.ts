import { computed, type Ref } from 'vue'

// Static imports of all supported schema versions.
// When a new CycloneDX version is released, add its schema here.
import schema14 from '@/schemas/bom-1.4.schema.json'
import schema15 from '@/schemas/bom-1.5.schema.json'
import schema16 from '@/schemas/bom-1.6.schema.json'
import schema17 from '@/schemas/bom-1.7.schema.json'

const schemas: Record<string, any> = {
  '1.4': schema14,
  '1.5': schema15,
  '1.6': schema16,
  '1.7': schema17
}

/**
 * Resolve a $ref pointer within a schema.
 * Only supports local refs of the form "#/definitions/xxx".
 */
function resolveRef(schema: any, ref: string): any {
  if (!ref.startsWith('#/')) return undefined
  const parts = ref.slice(2).split('/')
  let current = schema
  for (const part of parts) {
    if (current == null) return undefined
    current = current[part]
  }
  return current
}

/**
 * Get a property definition from a schema, resolving $ref if needed.
 */
function getPropertyDef(schema: any, obj: any, propertyName: string): any {
  if (!obj || !obj.properties) return undefined
  let prop = obj.properties[propertyName]
  if (!prop) return undefined

  // If the property itself is a $ref, resolve it
  if (prop.$ref) {
    const resolved = resolveRef(schema, prop.$ref)
    // Merge: the resolved definition may have a description,
    // but the referencing property may override it
    if (resolved) {
      return { ...resolved, ...prop, $ref: undefined }
    }
  }

  // If the property has items with a $ref (array type), resolve that
  if (prop.items && prop.items.$ref) {
    const resolved = resolveRef(schema, prop.items.$ref)
    if (resolved && resolved.description && !prop.description) {
      return { ...prop, description: resolved.description }
    }
  }

  return prop
}

/**
 * Schema path format:
 * - "bom.serialNumber"          → top-level BOM property
 * - "bom.metadata"              → top-level metadata (with description from BOM properties)
 * - "metadata.timestamp"        → metadata definition property
 * - "component.name"            → component definition property
 * - "service.name"              → service definition property
 * - "annotations.text"          → annotations definition property
 * - "compositions.aggregate"    → compositions definition property
 * - "dependency.ref"            → dependency definition property
 * - "externalReference.type"    → externalReference definition property
 * - "hash.alg"                  → hash definition property
 * - "property.name"             → property definition property
 * - "licenseChoice.*"           → licenseChoice definition property
 * - "cryptoProperties.*"        → from component.cryptoProperties sub-object
 * - "modelCard.*"               → from component.modelCard sub-object
 * - "data.*"                    → from component.data sub-object
 */
function getDescription(schema: any, path: string): string | undefined {
  if (!schema) return undefined

  const parts = path.split('.')
  if (parts.length < 2) return undefined

  const [section, ...rest] = parts
  const field = rest.join('.')

  // Top-level BOM properties
  if (section === 'bom') {
    const prop = getPropertyDef(schema, schema, field)
    return prop?.description
  }

  // Definition-based lookups
  const definitionMap: Record<string, string> = {
    metadata: 'metadata',
    component: 'component',
    service: 'service',
    annotations: 'annotations',
    compositions: 'compositions',
    dependency: 'dependency',
    externalReference: 'externalReference',
    hash: 'hash',
    property: 'property',
    licenseChoice: 'licenseChoice',
    organizationalEntity: 'organizationalEntity',
    organizationalContact: 'organizationalContact'
  }

  const defName = definitionMap[section ?? '']
  if (defName && schema.definitions?.[defName]) {
    const def = schema.definitions[defName]

    // Handle nested paths like "cryptoProperties.assetType"
    if (rest.length > 1) {
      // Navigate into nested object
      let current = def
      for (let i = 0; i < rest.length - 1; i++) {
        const prop = getPropertyDef(schema, current, rest[i] ?? '')
        if (!prop) return undefined
        // If prop has its own properties, descend into it
        if (prop.properties) {
          current = prop
        } else if (prop.$ref) {
          current = resolveRef(schema, prop.$ref)
        } else {
          return undefined
        }
      }
      const finalProp = getPropertyDef(schema, current, rest[rest.length - 1] ?? '')
      return finalProp?.description
    }

    const prop = getPropertyDef(schema, def, field)
    return prop?.description
  }

  // Special handling for nested component sub-definitions
  if (section === 'cryptoProperties' || section === 'modelCard' || section === 'data') {
    const componentDef = schema.definitions?.component
    if (!componentDef) return undefined

    let sectionProp = getPropertyDef(schema, componentDef, section)
    if (!sectionProp) return undefined

    // Resolve the ref if needed
    if (sectionProp.$ref) {
      sectionProp = resolveRef(schema, sectionProp.$ref)
    }

    if (rest.length === 0) {
      return sectionProp?.description
    }

    // Handle nested fields like algorithmProperties.primitive
    let current = sectionProp
    for (let i = 0; i < rest.length - 1; i++) {
      const prop = getPropertyDef(schema, current, rest[i] ?? '')
      if (!prop) return undefined
      if (prop.properties) {
        current = prop
      } else if (prop.$ref) {
        current = resolveRef(schema, prop.$ref)
      } else {
        return undefined
      }
    }
    const finalProp = getPropertyDef(schema, current, rest[rest.length - 1] ?? '')
    return finalProp?.description
  }

  return undefined
}

/**
 * Composable that provides schema-based tooltip descriptions.
 *
 * @param specVersion - A reactive ref to the current CycloneDX spec version (e.g., '1.6')
 *
 * Usage:
 * ```ts
 * const { tooltip } = useSchemaTooltips(specVersionRef)
 * const desc = tooltip('component.name') // Returns the description string or undefined
 * ```
 */
export function useSchemaTooltips(specVersion: Ref<string>) {
  const currentSchema = computed(() => {
    const version = specVersion.value
    return schemas[version] || schemas['1.6'] // fallback to 1.6
  })

  /**
   * Get a tooltip description from the CycloneDX schema.
   * Returns undefined if no description exists for the given path.
   */
  function tooltip(path: string): string | undefined {
    return getDescription(currentSchema.value, path)
  }

  return { tooltip, currentSchema }
}

/**
 * List of supported CycloneDX spec versions.
 */
export const SUPPORTED_SPEC_VERSIONS = Object.keys(schemas)
