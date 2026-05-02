import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import zlib from 'node:zlib'

type PngChunk = {
  type: string
  length: number
  crc: string
}

type TextEntry = {
  chunkType: 'tEXt' | 'zTXt' | 'iTXt'
  keyword: string
  text: string
  compressed?: boolean
  languageTag?: string
  translatedKeyword?: string
}

type FileReport = {
  file: string
  token_id: number | null
  width: number | null
  height: number | null
  chunks: PngChunk[]
  textEntries: TextEntry[]
}

const sourceDir = path.join(process.cwd(), 'data/gcs-bucket-dump/images')
const outputDir = path.join(process.cwd(), 'data/gcs-bucket-dump/extracted-metadata')

function readUInt32(buffer: Buffer, offset: number): number {
  return buffer.readUInt32BE(offset)
}

function parseIHDR(data: Buffer): { width: number; height: number } {
  return {
    width: data.readUInt32BE(0),
    height: data.readUInt32BE(4),
  }
}

function parseTextChunk(type: 'tEXt' | 'zTXt' | 'iTXt', data: Buffer): TextEntry | null {
  try {
    if (type === 'tEXt') {
      const nullIndex = data.indexOf(0)
      if (nullIndex < 0) return null
      return {
        chunkType: type,
        keyword: data.subarray(0, nullIndex).toString('latin1'),
        text: data.subarray(nullIndex + 1).toString('utf8'),
      }
    }

    if (type === 'zTXt') {
      const nullIndex = data.indexOf(0)
      if (nullIndex < 0) return null
      const keyword = data.subarray(0, nullIndex).toString('latin1')
      const compressionMethod = data[nullIndex + 1]
      if (compressionMethod !== 0) return null
      const compressed = data.subarray(nullIndex + 2)
      return {
        chunkType: type,
        keyword,
        compressed: true,
        text: zlib.inflateSync(compressed).toString('utf8'),
      }
    }

    const firstNull = data.indexOf(0)
    if (firstNull < 0) return null
    const keyword = data.subarray(0, firstNull).toString('utf8')
    const compressionFlag = data[firstNull + 1]
    const compressionMethod = data[firstNull + 2]
    let cursor = firstNull + 3

    const secondNull = data.indexOf(0, cursor)
    if (secondNull < 0) return null
    const languageTag = data.subarray(cursor, secondNull).toString('utf8')
    cursor = secondNull + 1

    const thirdNull = data.indexOf(0, cursor)
    if (thirdNull < 0) return null
    const translatedKeyword = data.subarray(cursor, thirdNull).toString('utf8')
    cursor = thirdNull + 1

    const textBytes = data.subarray(cursor)
    const text = compressionFlag === 1 && compressionMethod === 0
      ? zlib.inflateSync(textBytes).toString('utf8')
      : textBytes.toString('utf8')

    return {
      chunkType: type,
      keyword,
      compressed: compressionFlag === 1,
      languageTag,
      translatedKeyword,
      text,
    }
  } catch {
    return null
  }
}

function parsePng(buffer: Buffer, fileName: string): FileReport {
  const signature = buffer.subarray(0, 8).toString('hex')
  if (signature !== '89504e470d0a1a0a') {
    throw new Error(`Invalid PNG signature for ${fileName}`)
  }

  let offset = 8
  const chunks: PngChunk[] = []
  const textEntries: TextEntry[] = []
  let width: number | null = null
  let height: number | null = null

  while (offset + 12 <= buffer.length) {
    const length = readUInt32(buffer, offset)
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii')
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    const crcStart = dataEnd
    const crcEnd = crcStart + 4

    if (crcEnd > buffer.length) break

    const data = buffer.subarray(dataStart, dataEnd)
    const crc = buffer.subarray(crcStart, crcEnd).toString('hex')
    chunks.push({ type, length, crc })

    if (type === 'IHDR') {
      const ihdr = parseIHDR(data)
      width = ihdr.width
      height = ihdr.height
    }

    if (type === 'tEXt' || type === 'zTXt' || type === 'iTXt') {
      const entry = parseTextChunk(type, data)
      if (entry) textEntries.push(entry)
    }

    offset = crcEnd
    if (type === 'IEND') break
  }

  const tokenId = Number(path.basename(fileName, path.extname(fileName)))

  return {
    file: fileName,
    token_id: Number.isSafeInteger(tokenId) ? tokenId : null,
    width,
    height,
    chunks,
    textEntries,
  }
}

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true })
  const files = (await readdir(sourceDir)).filter((file) => file.toLowerCase().endsWith('.png')).sort((a, b) => Number(a.split('.')[0]) - Number(b.split('.')[0]))

  const reports: FileReport[] = []
  let withText = 0

  for (const file of files) {
    const fullPath = path.join(sourceDir, file)
    const buffer = await readFile(fullPath)
    const report = parsePng(buffer, file)
    reports.push(report)

    if (report.textEntries.length > 0) {
      withText += 1
      await writeFile(
        path.join(outputDir, `${path.basename(file, '.png')}.json`),
        JSON.stringify(report, null, 2)
      )
    }
  }

  const summary = {
    sourceDir,
    outputDir,
    scanned: reports.length,
    filesWithEmbeddedTextMetadata: withText,
    generatedAt: new Date().toISOString(),
  }

  await writeFile(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2))
  await writeFile(path.join(outputDir, 'all-reports.json'), JSON.stringify(reports, null, 2))

  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
