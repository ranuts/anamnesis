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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold tracking-wider text-slate-400 uppercase sm:text-xs">
            <tr>
              <th className="px-4 py-3 sm:px-6">{t("history.fileName")}</th>
              <th className="hidden px-4 py-3 sm:table-cell sm:px-6">
                {t("history.protocol")}
              </th>
              <th className="px-4 py-3 sm:px-6">{t("history.security")}</th>
              <th className="px-4 py-3 text-right sm:px-6">
                {t("history.action")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs sm:text-sm">
            {records.map((r) => (
              <tr
                key={r.txId}
                className="group transition-colors hover:bg-slate-50/50"
              >
                <td className="max-w-[120px] truncate px-4 py-4 font-bold text-slate-900 sm:max-w-[200px] sm:px-6">
                  {r.fileName}
                </td>
                <td className="hidden px-4 py-4 sm:table-cell sm:px-6">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${
                      r.storageType === "arweave"
                        ? "bg-orange-50 text-orange-700 ring-orange-200"
                        : "bg-blue-50 text-blue-700 ring-blue-200"
                    }`}
                  >
                    {r.storageType === "arweave" ? "Arweave" : "Irys"}
                  </span>
                </td>
                <td className="px-4 py-4 sm:px-6">
                  {r.encryptionAlgo !== "none" ? (
                    <div className="flex items-center gap-1.5 text-green-600">
                      <Shield className="h-3.5 w-3.5" />
                      <span className="hidden text-[10px] font-bold uppercase sm:inline">
                        {t("history.encrypted")}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {t("history.public")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-right sm:px-6">
                  <div className="flex items-center justify-end gap-1 sm:gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 sm:h-9 sm:w-9"
                    >
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
                        !!downloading ||
                        (r.encryptionAlgo !== "none" && !masterKey)
                      }
                      className={`h-8 w-8 transition-all sm:h-9 sm:w-9 ${
                        downloading === r.txId
                          ? "border-indigo-200 bg-indigo-50"
                          : ""
                      }`}
                    >
                      {downloading === r.txId ? (
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                      ) : r.encryptionAlgo !== "none" && !masterKey ? (
                        <Shield className="h-4 w-4 text-slate-300" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center text-sm font-medium text-slate-400 italic sm:px-6"
                >
                  {t("history.noRecords")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
