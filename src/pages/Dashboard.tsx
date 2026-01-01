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
import { History, Lock, LayoutDashboard } from "lucide-react"
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
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <LayoutDashboard className="h-7 w-7 text-indigo-600 sm:h-8 sm:w-8" />
            {t("common.dashboard")}
          </h2>
          <p className="text-sm text-slate-500 sm:text-base">
            {t("history.desc")}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-xs sm:px-4 sm:py-2">
          <div className="flex-1 sm:text-right">
            <div className="mb-0.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {t("common.activeAccountLabel")}
            </div>
            <div className="max-w-[180px] truncate text-sm font-bold text-slate-900">
              {walletManager.activeAddress
                ? walletManager.wallets.find(
                    (w) => w.address === walletManager.activeAddress,
                  )?.alias || "Unnamed"
                : t("common.noAccount")}
            </div>
          </div>
          <Link to="/account" className="sm:hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Lock className="h-4 w-4 text-slate-400" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:gap-8">
        <Card className="overflow-hidden border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:pb-6">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <History className="h-5 w-5 text-indigo-600" />
                {t("history.title")}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {t("history.desc")}
              </CardDescription>
            </div>
            {!walletManager.isUnlocked && (
              <Link to="/account" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 sm:w-auto"
                >
                  <Lock className="mr-2 h-3.5 w-3.5" />
                  {t("common.accountLocked")}
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <div className="overflow-x-auto">
              <HistoryTable
                records={uploadHistory || []}
                masterKey={walletManager.masterKey}
                activeAddress={walletManager.activeAddress}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
