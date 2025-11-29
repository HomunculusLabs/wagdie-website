/**
 * Download Character Images from IPFS
 *
 * This script downloads all WAGDIE character images from IPFS and saves them locally
 * to public/images/characters/{token_id}.png for faster loading.
 *
 * Prerequisites:
 *   - Run `npm run dev` first to start the local server
 *
 * Usage:
 *   npx ts-node scripts/download-character-images.ts
 *
 * Options:
 *   --dry-run     Show what would be downloaded without downloading
 *   --start=N     Start from page N (default: 1)
 *   --limit=N     Limit to N images (for testing)
 *   --concurrency=N  Number of concurrent downloads (default: 5)
 *   --base-url=URL   API base URL (default: http://localhost:3000)
 */

import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'

// Configuration
const IPFS_GATEWAYS = [
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/',
]

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'characters')
const PER_PAGE = 100 // Fetch 100 characters per API call

// Parse CLI arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const startArg = args.find(a => a.startsWith('--start='))
const limitArg = args.find(a => a.startsWith('--limit='))
const concurrencyArg = args.find(a => a.startsWith('--concurrency='))
const baseUrlArg = args.find(a => a.startsWith('--base-url='))

const startPage = startArg ? parseInt(startArg.split('=')[1]) : 1
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined
const concurrency = concurrencyArg ? parseInt(concurrencyArg.split('=')[1]) : 5
const baseUrl = baseUrlArg ? baseUrlArg.split('=')[1] : 'http://localhost:3000'

interface Character {
  token_id: number
  metadata?: {
    image?: string
  } | null
  image_url?: string
}

interface ApiResponse {
  characters: Character[]
  totalCount: number
  hasMore: boolean
}

/**
 * Fetch characters from local API
 */
async function fetchCharacters(page: number): Promise<ApiResponse> {
  const url = `${baseUrl}/api/characters?page=${page}&perPage=${PER_PAGE}&tab=all&sort=asc`

  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http

    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`API returned ${response.statusCode}`))
        return
      }

      let data = ''
      response.on('data', chunk => data += chunk)
      response.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(new Error('Failed to parse API response'))
        }
      })
    }).on('error', reject)
  })
}

/**
 * Download a file from URL with retry logic across multiple gateways
 */
async function downloadImage(ipfsHash: string, outputPath: string): Promise<boolean> {
  for (const gateway of IPFS_GATEWAYS) {
    const url = `${gateway}${ipfsHash}`
    try {
      await downloadFromUrl(url, outputPath)
      return true
    } catch (error) {
      // Try next gateway
    }
  }
  return false
}

/**
 * Download file from a specific URL
 */
function downloadFromUrl(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Download timeout'))
    }, 30000)

    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        clearTimeout(timeout)
        const redirectUrl = response.headers.location
        if (redirectUrl) {
          downloadFromUrl(redirectUrl, outputPath).then(resolve).catch(reject)
          return
        }
      }

      if (response.statusCode !== 200) {
        clearTimeout(timeout)
        reject(new Error(`HTTP ${response.statusCode}`))
        return
      }

      const file = fs.createWriteStream(outputPath)
      response.pipe(file)

      file.on('finish', () => {
        clearTimeout(timeout)
        file.close()
        resolve()
      })

      file.on('error', (err) => {
        clearTimeout(timeout)
        fs.unlink(outputPath, () => {})
        reject(err)
      })
    }).on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

/**
 * Extract IPFS hash from ipfs:// URL
 */
function extractIpfsHash(ipfsUrl: string): string | null {
  if (!ipfsUrl) return null
  if (ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl.replace('ipfs://', '')
  }
  const match = ipfsUrl.match(/\/ipfs\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

/**
 * Process a batch of characters
 */
async function processBatch(
  characters: Character[],
  onProgress: (current: string) => void
): Promise<{ success: number; failed: number; skipped: number }> {
  let success = 0
  let failed = 0
  let skipped = 0

  // Process in chunks for concurrency control
  for (let i = 0; i < characters.length; i += concurrency) {
    const batch = characters.slice(i, i + concurrency)

    await Promise.all(batch.map(async (char) => {
      const outputPath = path.join(OUTPUT_DIR, `${char.token_id}.png`)

      // Skip if already exists
      if (fs.existsSync(outputPath)) {
        skipped++
        onProgress(`#${char.token_id} (skipped)`)
        return
      }

      const ipfsUrl = char.metadata?.image || char.image_url
      if (!ipfsUrl) {
        failed++
        onProgress(`#${char.token_id} (no image)`)
        return
      }

      const ipfsHash = extractIpfsHash(ipfsUrl)
      if (!ipfsHash) {
        failed++
        onProgress(`#${char.token_id} (invalid URL)`)
        return
      }

      if (isDryRun) {
        console.log(`Would download: ${ipfsHash} -> ${char.token_id}.png`)
        success++
        return
      }

      const downloaded = await downloadImage(ipfsHash, outputPath)
      if (downloaded) {
        success++
        onProgress(`#${char.token_id} ✓`)
      } else {
        failed++
        onProgress(`#${char.token_id} ✗`)
      }
    }))
  }

  return { success, failed, skipped }
}

async function main() {
  console.log('='.repeat(60))
  console.log('WAGDIE Character Image Downloader')
  console.log('='.repeat(60))
  console.log()
  console.log(`API: ${baseUrl}`)
  console.log(`Output: ${OUTPUT_DIR}`)
  console.log(`Concurrency: ${concurrency}`)
  if (isDryRun) console.log('DRY RUN - no files will be downloaded')
  if (limit) console.log(`Limit: ${limit} images`)
  console.log()

  // Create output directory
  if (!isDryRun) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Test API connection
  console.log('Testing API connection...')
  try {
    const test = await fetchCharacters(1)
    console.log(`Connected! Found ${test.totalCount} total characters`)
    console.log()
  } catch (error: any) {
    console.error(`Failed to connect to API: ${error.message}`)
    console.error()
    console.error('Make sure the dev server is running:')
    console.error('  npm run dev')
    console.error()
    console.error('Or specify a different URL:')
    console.error('  npx ts-node scripts/download-character-images.ts --base-url=http://localhost:3000')
    process.exit(1)
  }

  const startTime = Date.now()
  let totalSuccess = 0
  let totalFailed = 0
  let totalSkipped = 0
  let totalProcessed = 0
  let page = startPage

  // Fetch and process characters page by page
  while (true) {
    if (limit && totalProcessed >= limit) break

    process.stdout.write(`Fetching page ${page}...`)

    let response: ApiResponse
    try {
      response = await fetchCharacters(page)
    } catch (error: any) {
      console.error(` Failed: ${error.message}`)
      break
    }

    if (response.characters.length === 0) {
      console.log(' No more characters')
      break
    }

    console.log(` Got ${response.characters.length} characters`)

    // Apply limit
    let characters = response.characters
    if (limit && totalProcessed + characters.length > limit) {
      characters = characters.slice(0, limit - totalProcessed)
    }

    const result = await processBatch(characters, (current) => {
      process.stdout.write(`\r  Processing: ${current}`.padEnd(50))
    })

    totalSuccess += result.success
    totalFailed += result.failed
    totalSkipped += result.skipped
    totalProcessed += characters.length

    console.log(`\r  Page ${page}: ${result.success} downloaded, ${result.skipped} skipped, ${result.failed} failed`.padEnd(60))

    if (!response.hasMore) break
    page++
  }

  // Final summary
  console.log()
  console.log('='.repeat(60))
  console.log('Download Complete!')
  console.log('='.repeat(60))
  console.log(`  Downloaded: ${totalSuccess}`)
  console.log(`  Skipped (already exists): ${totalSkipped}`)
  console.log(`  Failed: ${totalFailed}`)
  console.log(`  Total time: ${Math.round((Date.now() - startTime) / 1000)}s`)
  console.log()

  if (totalFailed > 0) {
    console.log('Some downloads failed. Re-run the script to retry.')
    console.log('Already downloaded images will be skipped.')
  }
}

main().catch(console.error)
