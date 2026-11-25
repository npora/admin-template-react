import { gzip, brotliCompress } from 'node:zlib'
import { promisify } from 'node:util'
import type { Plugin } from 'vite'

const compressGzip = promisify(gzip)
const compressBrotli = promisify(brotliCompress)
const compressible = /\.(?:html|css|[cm]?js|json|svg|txt)$/i

export function buildOutput({ compress, analyze }: { compress: boolean; analyze: boolean }): Plugin {
  return {
    name: 'npora-build-output',
    apply: 'build',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      async handler(_options, bundle) {
        const manifest = await Promise.all(Object.values(bundle).map(async (entry) => {
          const content = entry.type === 'chunk' ? entry.code : entry.source
          const bytes = typeof content === 'string' ? Buffer.from(content) : content
          const gzipBytes = analyze || (compress && bytes.length >= 10 * 1024 && compressible.test(entry.fileName))
            ? await compressGzip(bytes)
            : undefined

          if (compress && bytes.length >= 10 * 1024 && compressible.test(entry.fileName) &&
            gzipBytes && gzipBytes.length < bytes.length) {
            this.emitFile({ type: 'asset', fileName: entry.fileName + '.gz', source: gzipBytes })
          }

          if (!analyze) return undefined
          return {
            file: entry.fileName,
            bytes: bytes.length,
            gzip: gzipBytes?.length,
            brotli: (await compressBrotli(bytes)).length,
            modules: entry.type === 'chunk' ? Object.keys(entry.modules).length : undefined
          }
        }))
        if (analyze) {
          this.emitFile({
            type: 'asset',
            fileName: 'bundle-report.json',
            source: JSON.stringify(manifest, null, 2) + '\n'
          })
        }
      }
    }
  }
}
