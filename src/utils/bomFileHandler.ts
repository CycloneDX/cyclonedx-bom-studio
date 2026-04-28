import { sanitizeFilename, MAX_FILE_SIZE } from '@/utils/sanitize'
import { DEFAULT_SPEC_VERSION } from '@/utils/specVersions'

/**
 * Build a default download filename for a BOM, per SPEC §22.2.
 *
 * Prefers `<metadata.component.name>-<metadata.component.version>.cdx.<ext>`
 * when both name and version are present, falls back to
 * `<metadata.component.name>.cdx.<ext>` when only name is present, and
 * finally to `bom.cdx.<ext>` when no usable component metadata exists.
 *
 * The returned name is always run through sanitizeFilename and is guaranteed
 * to end in `.cdx.<ext>`.
 */
export function deriveBomFilename(bom: any, ext: 'json' | 'xml' = 'json'): string {
  const component = bom?.metadata?.component
  const rawName = typeof component?.name === 'string' ? component.name.trim() : ''
  const rawVersion = typeof component?.version === 'string' ? component.version.trim() : ''

  let stem: string
  if (rawName && rawVersion) {
    stem = `${rawName}-${rawVersion}`
  } else if (rawName) {
    stem = rawName
  } else {
    stem = 'bom'
  }

  const sanitized = sanitizeFilename(`${stem}.cdx.${ext}`)
  // sanitizeFilename can strip everything (e.g. an all-punctuation name),
  // in which case it returns 'bom-export'. Guarantee the .cdx.<ext> suffix
  // and a 'bom' fallback stem so the spec contract holds.
  if (!sanitized.toLowerCase().endsWith(`.cdx.${ext}`)) {
    return `bom.cdx.${ext}`
  }
  return sanitized
}

/**
 * Download BOM as JSON file
 */
export function downloadBomAsJson(bom: any, filename?: string): void {
  const bomJson = JSON.stringify(bom, null, 2)
  const blob = new Blob([bomJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const safeName = filename
    ? sanitizeFilename(filename.endsWith('.json') ? filename : `${filename}.json`)
    : deriveBomFilename(bom, 'json')
  link.download = safeName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Load BOM from a selected file
 */
export async function loadBomFromFile(): Promise<any> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'

    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }

      // Enforce file size limit
      if (file.size > MAX_FILE_SIZE) {
        reject(new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`))
        return
      }

      // Validate file extension
      if (!file.name.toLowerCase().endsWith('.json')) {
        reject(new Error('Only .json files are accepted'))
        return
      }

      try {
        const text = await file.text()
        const json = JSON.parse(text)

        // Basic structural validation
        if (!json || typeof json !== 'object' || Array.isArray(json)) {
          reject(new Error('File must contain a JSON object'))
          return
        }

        resolve(json)
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${error}`))
      }
    }

    input.onerror = () => reject(new Error('File selection cancelled'))
    input.click()
  })
}

/**
 * Copy BOM to clipboard as JSON
 */
export async function copyBomToClipboard(bom: any, minified: boolean = false): Promise<void> {
  try {
    const bomJson = minified ? JSON.stringify(bom) : JSON.stringify(bom, null, 2)
    await navigator.clipboard.writeText(bomJson)
  } catch (error) {
    throw new Error(`Failed to copy to clipboard: ${error}`)
  }
}

/**
 * Export BOM as XML (CycloneDX XML format)
 */
export function downloadBomAsXml(bom: any, filename?: string): void {
  const specVersion = bom.specVersion || DEFAULT_SPEC_VERSION
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
  xml += `<bom xmlns="http://cyclonedx.org/schema/bom/${specVersion}/bom.xsd" version="${bom.version || 1}">\n`

  if (bom.metadata) {
    xml += `  <metadata>\n`
    if (bom.metadata.timestamp) {
      xml += `    <timestamp>${escapeXml(bom.metadata.timestamp)}</timestamp>\n`
    }
    if (bom.metadata.tools?.components?.length) {
      xml += `    <tools>\n`
      for (const tool of bom.metadata.tools.components) {
        xml += `      <tool>\n`
        xml += `        <vendor>${escapeXml(tool.vendor || '')}</vendor>\n`
        xml += `        <name>${escapeXml(tool.name || '')}</name>\n`
        xml += `        <version>${escapeXml(tool.version || '')}</version>\n`
        xml += `      </tool>\n`
      }
      xml += `    </tools>\n`
    }
    xml += `  </metadata>\n`
  }

  if (bom.components?.length) {
    xml += `  <components>\n`
    for (const comp of bom.components) {
      xml += `    <component type="${escapeXml(comp.type || 'library')}">\n`
      xml += `      <name>${escapeXml(comp.name || '')}</name>\n`
      if (comp.version) {
        xml += `      <version>${escapeXml(comp.version)}</version>\n`
      }
      if (comp.purl) {
        xml += `      <purl>${escapeXml(comp.purl)}</purl>\n`
      }
      xml += `    </component>\n`
    }
    xml += `  </components>\n`
  }

  xml += `</bom>`

  const blob = new Blob([xml], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const safeXmlName = filename
    ? sanitizeFilename(filename.endsWith('.xml') ? filename : `${filename}.xml`)
    : deriveBomFilename(bom, 'xml')
  link.download = safeXmlName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  }
  return String(str).replace(/[&<>"']/g, (c) => map[c] || c)
}

/**
 * Validate BOM JSON structure
 */
export function validateBomStructure(bom: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!bom || typeof bom !== 'object') {
    errors.push('BOM must be a valid JSON object')
    return { valid: false, errors }
  }

  if (!bom.bomFormat || bom.bomFormat !== 'CycloneDX') {
    errors.push('bomFormat must be "CycloneDX"')
  }

  if (!bom.specVersion) {
    errors.push('specVersion is required')
  }

  if (!bom.serialNumber) {
    errors.push('serialNumber is required')
  }

  if (bom.components && !Array.isArray(bom.components)) {
    errors.push('components must be an array')
  }

  if (bom.services && !Array.isArray(bom.services)) {
    errors.push('services must be an array')
  }

  if (bom.dependencies && !Array.isArray(bom.dependencies)) {
    errors.push('dependencies must be an array')
  }

  return { valid: errors.length === 0, errors }
}
