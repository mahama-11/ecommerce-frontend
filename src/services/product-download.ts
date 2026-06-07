import type { DownloadRecord, ExportTask } from '@/types/product'
import { downloadBinary } from './http'

function internalEcommerceDownloadPath(url: string) {
  if (!url) return ''
  if (url.startsWith('/api/v1/ecommerce/')) return url
  try {
    const parsed = new URL(url, window.location.origin)
    if (parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/v1/ecommerce/')) {
      return `${parsed.pathname}${parsed.search}`
    }
  } catch {
    return ''
  }
  return ''
}

export async function downloadExport(record: Pick<DownloadRecord, 'id' | 'packageUrl' | 'downloadFileName'>) {
  if (record.packageUrl) {
    const internalPath = internalEcommerceDownloadPath(record.packageUrl)
    if (internalPath) {
      await downloadBinary(internalPath, record.downloadFileName)
      return
    }
    window.open(record.packageUrl, '_blank', 'noopener,noreferrer')
    return
  }
  await downloadBinary(`/api/v1/ecommerce/downloads/${record.id}/content`, record.downloadFileName)
}

export async function downloadExportTask(task: Pick<ExportTask, 'id' | 'packageUrl' | 'format'>, fallbackFileName?: string) {
  if (task.packageUrl) {
    const internalPath = internalEcommerceDownloadPath(task.packageUrl)
    if (internalPath) {
      await downloadBinary(internalPath, fallbackFileName || `export.${task.format}`)
      return
    }
    window.open(task.packageUrl, '_blank', 'noopener,noreferrer')
    return
  }
  await downloadBinary(`/api/v1/ecommerce/downloads/${task.id}/content`, fallbackFileName || `export.${task.format}`)
}
