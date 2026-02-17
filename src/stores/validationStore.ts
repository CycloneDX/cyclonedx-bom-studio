import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { parse as jsoncParse, printParseErrorCode } from 'jsonc-parser'
import type { ParseError } from 'jsonc-parser'
import schema14 from '@/schemas/bom-1.4.schema.json'
import schema15 from '@/schemas/bom-1.5.schema.json'
import schema16 from '@/schemas/bom-1.6.schema.json'
import schema17 from '@/schemas/bom-1.7.schema.json'

export interface ValidationError { path: string; message: string; keyword?: string }
export interface ValidationWarning { path: string; message: string; recommendation?: string }
export interface CompletenessItem { key: string; labelKey: string; present: boolean }

// Schema map keyed by spec version
const schemas: Record<string, any> = {
  '1.4': schema14,
  '1.5': schema15,
  '1.6': schema16,
  '1.7': schema17,
}

// Create a separate AJV instance per schema to avoid $id collisions
// and register stub schemas for external $ref dependencies
function createValidator(schema: any): ReturnType<typeof Ajv.prototype.compile> | null {
  const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false })
  addFormats(ajv)

  // Register stubs for external schemas referenced by CycloneDX.
  // The main schemas use relative $ref (e.g. "spdx.SNAPSHOT.schema.json")
  // which AJV resolves against the $id base URI "http://cyclonedx.org/schema/".
  const base = 'http://cyclonedx.org/schema/'

  // SPDX license IDs — accept any string (actual enum has 500+ entries)
  ajv.addSchema({ type: 'string' }, `${base}spdx.SNAPSHOT.schema.json`)

  // JSF signature — accept any object
  ajv.addSchema(
    { definitions: { signature: { type: 'object' } } },
    `${base}jsf-0.82.SNAPSHOT.schema.json`,
  )

  // Cryptography definitions — accept any string for enum refs
  ajv.addSchema(
    { definitions: { algorithmFamiliesEnum: { type: 'string' }, ellipticCurvesEnum: { type: 'string' } } },
    `${base}cryptography-defs.SNAPSHOT.schema.json`,
  )

  try {
    return ajv.compile(schema)
  } catch {
    return null
  }
}

// Pre-compile validators (one AJV instance per version)
const validators: Record<string, ReturnType<typeof Ajv.prototype.compile>> = {}
for (const [version, schema] of Object.entries(schemas)) {
  const validator = createValidator(schema)
  if (validator) {
    validators[version] = validator
  }
}

/**
 * Convert a JSON path like "/components/0/name" into a friendly location string
 */
function friendlyPath(instancePath: string): string {
  if (!instancePath) return 'BOM root'
  const parts = instancePath.split('/').filter(Boolean)
  const result: string[] = []
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i] ?? ''
    const nextPart = parts[i + 1]
    // If the next part is a number, combine "components/0" → "Component #1"
    if (nextPart !== undefined && /^\d+$/.test(nextPart)) {
      const singular = part.replace(/s$/, '')
      const label = singular.charAt(0).toUpperCase() + singular.slice(1)
      result.push(`${label} #${Number(nextPart) + 1}`)
      i++ // skip the index
    } else if (/^\d+$/.test(part)) {
      // standalone number (shouldn't happen after the above logic)
      result.push(`#${Number(part) + 1}`)
    } else {
      result.push(part)
    }
  }
  return result.join(' → ')
}

/**
 * Convert an AJV error into a user-friendly message
 */
function friendlyMessage(error: any): string {
  const loc = friendlyPath(error.instancePath)
  const keyword = error.keyword

  switch (keyword) {
    case 'required': {
      const field = error.params?.missingProperty || 'unknown field'
      return `${loc}: Missing required field "${field}"`
    }
    case 'type': {
      const expected = error.params?.type || 'unknown'
      return `${loc}: Expected type "${expected}"`
    }
    case 'enum': {
      const allowed = error.params?.allowedValues?.join(', ') || ''
      return `${loc}: Must be one of: ${allowed}`
    }
    case 'pattern':
      return `${loc}: Value does not match the expected format`
    case 'format': {
      const fmt = error.params?.format || 'unknown'
      return `${loc}: Invalid ${fmt} format`
    }
    case 'minLength':
      return `${loc}: Value is too short (minimum ${error.params?.limit || 1} character${(error.params?.limit || 1) > 1 ? 's' : ''})`
    case 'maxLength':
      return `${loc}: Value is too long (maximum ${error.params?.limit} characters)`
    case 'minimum':
      return `${loc}: Value must be at least ${error.params?.limit}`
    case 'maximum':
      return `${loc}: Value must be at most ${error.params?.limit}`
    case 'minItems':
      return `${loc}: Must contain at least ${error.params?.limit} item${(error.params?.limit || 1) > 1 ? 's' : ''}`
    case 'additionalProperties': {
      const prop = error.params?.additionalProperty || 'unknown'
      return `${loc}: Unexpected field "${prop}" is not allowed`
    }
    case 'oneOf':
      return `${loc}: Must match exactly one of the allowed schemas`
    case 'anyOf':
      return `${loc}: Does not match any of the allowed schemas`
    case 'if':
      return '' // Skip 'if' keyword errors — they're usually noise
    case 'const':
      return `${loc}: Must be "${error.params?.allowedValue}"`
    default:
      return `${loc}: ${error.message || 'Validation failed'}`
  }
}

export const useValidationStore = defineStore('validation', () => {
  const errors = ref<ValidationError[]>([])
  const warnings = ref<ValidationWarning[]>([])
  const isValidating = ref(false)
  const completenessItems = ref<CompletenessItem[]>([])
  const completenessScore = ref(0)

  const errorCount = computed(() => errors.value.length)
  const warningCount = computed(() => warnings.value.length)
  const isValid = computed(() => errors.value.length === 0)
  const completenessStatus = computed(() => completenessScore.value >= 75 ? 'green' : completenessScore.value >= 40 ? 'amber' : 'red')

  function setErrors(e: ValidationError[]) { errors.value = e }
  function setWarnings(w: ValidationWarning[]) { warnings.value = w }
  function clearResults() { errors.value = []; warnings.value = [] }

  /**
   * Run AJV schema validation against the BOM export object.
   * Produces multiple specific errors with friendly messages.
   */
  function validateBom(bomExport: any) {
    if (!bomExport || typeof bomExport !== 'object') {
      errors.value = [{ path: '', message: 'BOM must be a valid JSON object' }]
      return
    }

    const specVersion = String(bomExport.specVersion || '1.6')
    const validator = validators[specVersion] || validators['1.6']

    if (!validator) {
      errors.value = [{ path: '', message: `No schema available for spec version ${specVersion}` }]
      return
    }

    const valid = validator(bomExport)

    if (valid) {
      errors.value = []
    } else {
      const ajvErrors = validator.errors || []
      const mapped: ValidationError[] = []
      const seen = new Set<string>()

      for (const err of ajvErrors) {
        const msg = friendlyMessage(err)
        if (!msg) continue // skip empty messages (e.g. 'if' keyword)
        // Deduplicate by message
        if (seen.has(msg)) continue
        seen.add(msg)
        mapped.push({
          path: err.instancePath || '',
          message: msg,
          keyword: err.keyword,
        })
      }

      errors.value = mapped
    }
  }

  /**
   * Convert a character offset in text to a line and column number.
   */
  function offsetToLineCol(text: string, offset: number): { line: number; col: number } {
    let line = 1
    let col = 1
    for (let i = 0; i < offset && i < text.length; i++) {
      if (text[i] === '\n') {
        line++
        col = 1
      } else {
        col++
      }
    }
    return { line, col }
  }

  /**
   * Convert a jsonc-parser error code into a user-friendly message.
   */
  function friendlyParseError(error: ParseError, text: string): string {
    const { line, col } = offsetToLineCol(text, error.offset)
    const codeName = printParseErrorCode(error.error)
    const location = `Line ${line}, column ${col}`

    switch (codeName) {
      case 'InvalidSymbol':
        return `${location}: Unexpected character found`
      case 'InvalidNumberFormat':
        return `${location}: Invalid number format`
      case 'PropertyNameExpected':
        return `${location}: Expected a property name (in double quotes)`
      case 'ValueExpected':
        return `${location}: Expected a value`
      case 'ColonExpected':
        return `${location}: Expected a colon ":" after the property name`
      case 'CommaExpected':
        return `${location}: Expected a comma "," or closing bracket`
      case 'CloseBraceExpected':
        return `${location}: Expected a closing brace "}"`
      case 'CloseBracketExpected':
        return `${location}: Expected a closing bracket "]"`
      case 'EndOfFileExpected':
        return `${location}: Unexpected content after end of JSON`
      case 'InvalidCommentToken':
        return `${location}: Comments are not allowed in standard JSON`
      case 'UnexpectedEndOfComment':
        return `${location}: Unterminated comment`
      case 'UnexpectedEndOfString':
        return `${location}: Unterminated string (missing closing quote)`
      case 'UnexpectedEndOfNumber':
        return `${location}: Incomplete number`
      case 'InvalidUnicode':
        return `${location}: Invalid Unicode escape sequence`
      case 'InvalidEscapeCharacter':
        return `${location}: Invalid escape character`
      case 'InvalidCharacter':
        return `${location}: Invalid character`
      default:
        return `${location}: ${codeName}`
    }
  }

  /**
   * Validate raw JSON text from the JSON source editor.
   * Uses jsonc-parser to find ALL syntax errors (not just the first),
   * then runs AJV schema validation if the JSON is parseable.
   */
  function validateJsonText(jsonText: string) {
    const parseErrors: ParseError[] = []
    const parsed = jsoncParse(jsonText, parseErrors, { allowTrailingComma: false })

    if (parseErrors.length > 0) {
      // Report all syntax errors
      errors.value = parseErrors.map(e => ({
        path: '',
        message: friendlyParseError(e, jsonText),
        keyword: 'parse',
      }))
      return
    }

    // JSON is syntactically valid — run schema validation
    validateBom(parsed)
  }

  function updateCompleteness(bom: any) {
    const checks = [
      { key: 'supplier', labelKey: 'completeness.supplierIdentified', check: () => !!(bom.metadata?.supplier?.name || bom.components?.some((c: any) => c.supplier?.name)) },
      { key: 'named', labelKey: 'completeness.componentsNamed', check: () => bom.components?.length > 0 && bom.components.every((c: any) => c.name) },
      { key: 'versioned', labelKey: 'completeness.componentsVersioned', check: () => bom.components?.length > 0 && bom.components.every((c: any) => c.version) },
      { key: 'identity', labelKey: 'completeness.componentIdentity', check: () => bom.components?.length > 0 && bom.components.every((c: any) => c.cpe || c.purl || c.swid) },
      { key: 'deps', labelKey: 'completeness.dependenciesDocumented', check: () => bom.dependencies?.length > 0 },
      { key: 'authorship', labelKey: 'completeness.bomAuthorship', check: () => !!(bom.metadata?.authors?.length > 0 || bom.metadata?.manufacturer?.name) },
      { key: 'timestamp', labelKey: 'completeness.timestampPresent', check: () => !!bom.metadata?.timestamp },
      { key: 'lifecycles', labelKey: 'completeness.lifecyclesPresent', check: () => bom.metadata?.lifecycles?.length > 0 },
      { key: 'tools', labelKey: 'completeness.toolsPresent', check: () => !!(bom.metadata?.tools?.components?.length > 0) },
      { key: 'hashes', labelKey: 'completeness.componentHashes', check: () => bom.components?.some((c: any) => c.hashes?.length > 0) },
      { key: 'licenses', labelKey: 'completeness.licensesPresent', check: () => bom.components?.some((c: any) => c.licenses?.length > 0) },
      { key: 'compositions', labelKey: 'completeness.completenessAssertions', check: () => bom.compositions?.length > 0 },
    ]
    const items = checks.map(c => ({ key: c.key, labelKey: c.labelKey, present: c.check() }))
    completenessItems.value = items
    const passed = items.filter(i => i.present).length
    completenessScore.value = Math.round((passed / items.length) * 100)
  }

  return {
    errors, warnings, isValidating, completenessItems, completenessScore,
    errorCount, warningCount, isValid, completenessStatus,
    setErrors, setWarnings, clearResults,
    validateBom, validateJsonText, updateCompleteness,
  }
})
