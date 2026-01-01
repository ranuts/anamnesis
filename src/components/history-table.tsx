import type { UploadRecord } from "@/lib/db"
import { decryptData, fromBase64 } from "@/lib/crypto"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, Loader2, Shield } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useTranslation } from "@/i18n/config"

export function HistoryTable({
  records,
  masterKey,
  activeAddress,
}: {
  records: UploadRecord[]
  masterKey: Uint8Array | null
  activeAddress: string | null
}) {
  const { t } = useTranslation()
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownload = async (record: UploadRecord) => {
    if (record.ownerAddress !== activeAddress) {
      toast.error(t("history.errorOwner"))
      return
    }

    if (record.encryptionAlgo !== "none" && !masterKey) {
      toast.error(t("history.errorLocked"))
      return
    }

    setDownloading(record.txId)
    try {
      const response = await fetch(`https://arweave.net/${record.txId}`)
      if (!response.ok) throw new Error("Failed to fetch data from Arweave")

      const buffer = await response.arrayBuffer()
      let data = new Uint8Array(buffer)

      if (record.encryptionAlgo !== "none") {
        const { nonce } = JSON.parse(record.encryptionParams)
        data = await decryptData(data, fromBase64(nonce), masterKey!)
      }

      const blob = new Blob([data])
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = record.fileName
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t("history.successDownload"))
    } catch (e: any) {
      toast.error(t("history.failedDownload", { message: e.message }))
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="p-3 text-left font-medium text-slate-500">
              {t("history.fileName")}
            </th>
            <th className="p-3 text-left font-medium text-slate-500">
              {t("history.protocol")}
            </th>
            <th className="p-3 text-left font-medium text-slate-500">
              {t("history.security")}
            </th>
            <th className="p-3 text-right font-medium text-slate-500">
              {t("history.action")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((r) => (
            <tr key={r.txId} className="transition-colors hover:bg-slate-50">
              <td className="max-w-[150px] truncate p-3 font-medium">
                {r.fileName}
              </td>
              <td className="p-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    r.storageType === "arweave"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {r.storageType === "arweave"
                    ? "Arweave Native"
                    : "Irys Datachain"}
                </span>
              </td>
              <td className="p-3">
                {r.encryptionAlgo !== "none" ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Shield className="h-3 w-3" />
                    <span className="text-[10px]">
                      {t("history.encrypted")}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    {t("history.public")}
                  </span>
                )}
              </td>
              <td className="space-x-2 p-3 text-right">
                <Button variant="ghost" size="icon" asChild>
                  <a
                    href={`https://arweave.net/${r.txId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDownload(r)}
                  disabled={
                    !!downloading || (r.encryptionAlgo !== "none" && !masterKey)
                  }
                >
                  {downloading === r.txId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : r.encryptionAlgo !== "none" && !masterKey ? (
                    <Shield className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                {t("history.noRecords")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
