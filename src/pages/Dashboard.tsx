import { useTranslation } from "@/i18n/config"
import { useWalletManager } from "@/hooks/use-wallet-manager"
import { db } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"
import { HistoryTable } from "@/components/history-table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { History, Lock, ShieldCheck, LayoutDashboard } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { t } = useTranslation()
  const walletManager = useWalletManager()

  const uploadHistory = useLiveQuery(
    () => db.uploads.orderBy("createdAt").reverse().toArray(),
    [],
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <LayoutDashboard className="h-8 w-8 text-indigo-600" />
            {t("common.dashboard")}
          </h2>
          <p className="text-slate-500">{t("history.desc")}</p>
        </div>

        <div className="hidden rounded-lg border border-slate-100 bg-white px-4 py-2 text-right shadow-xs sm:block">
          <div className="mb-0.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {t("common.activeIdentity")}
          </div>
          <div className="max-w-[180px] truncate text-sm font-bold text-slate-900">
            {walletManager.activeAddress
              ? walletManager.wallets.find(
                  (w) => w.address === walletManager.activeAddress,
                )?.alias || "Unnamed"
              : t("common.noIdentity")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-6">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <History className="h-5 w-5 text-indigo-600" />
                {t("history.title")}
              </CardTitle>
              <CardDescription>{t("history.desc")}</CardDescription>
            </div>
            {!walletManager.isUnlocked && (
              <Link to="/account">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700"
                >
                  <Lock className="mr-2 h-3 w-3" />
                  {t("common.identityLocked")}
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            <HistoryTable
              records={uploadHistory || []}
              masterKey={walletManager.masterKey}
              activeAddress={walletManager.activeAddress}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
