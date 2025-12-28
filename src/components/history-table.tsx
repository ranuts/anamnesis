import { db } from "@/lib/db";
import type { UploadRecord } from "@/lib/db";
import { decryptData, fromBase64 } from "@/lib/crypto";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function HistoryTable({ 
  records, 
  masterKey,
  activeAddress 
}: { 
  records: UploadRecord[], 
  masterKey: Uint8Array | null,
  activeAddress: string | null
}) {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (record: UploadRecord) => {
    if (record.ownerAddress !== activeAddress) {
      toast.error(t("history.errorOwner"));
      return;
    }

    if (record.encryptionAlgo !== "none" && !masterKey) {
      toast.error(t("history.errorLocked"));
      return;
    }

    setDownloading(record.txId);
    try {
      const response = await fetch(`https://arweave.net/${record.txId}`);
      if (!response.ok) throw new Error("Failed to fetch data from Arweave");
      
      const buffer = await response.arrayBuffer();
      let data = new Uint8Array(buffer);

      if (record.encryptionAlgo !== "none") {
        const { nonce } = JSON.parse(record.encryptionParams);
        data = await decryptData(
          data,
          fromBase64(nonce),
          masterKey!
        );
      }

      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = record.fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("history.successDownload"));
    } catch (e: any) {
      toast.error(t("history.failedDownload", { message: e.message }));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="rounded-md border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left p-3 font-medium text-slate-500">{t("history.fileName")}</th>
            <th className="text-left p-3 font-medium text-slate-500">{t("history.protocol")}</th>
            <th className="text-left p-3 font-medium text-slate-500">{t("history.security")}</th>
            <th className="text-right p-3 font-medium text-slate-500">{t("history.action")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((r) => (
            <tr key={r.txId} className="hover:bg-slate-50 transition-colors">
              <td className="p-3 font-medium truncate max-w-[150px]">{r.fileName}</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                  r.storageType === "arweave" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {r.storageType === "arweave" ? "Arweave Native" : "Irys Datachain"}
                </span>
              </td>
              <td className="p-3">
                {r.encryptionAlgo !== "none" ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Shield className="w-3 h-3" />
                    <span className="text-[10px]">{t("history.encrypted")}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-[10px]">{t("history.public")}</span>
                )}
              </td>
              <td className="p-3 text-right space-x-2">
                <Button variant="ghost" size="icon" asChild>
                  <a href={`https://arweave.net/${r.txId}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleDownload(r)}
                  disabled={!!downloading}
                >
                  {downloading === r.txId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
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
  );
}
