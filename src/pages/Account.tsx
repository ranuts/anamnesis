import { useState } from "react"
import { useTranslation } from "@/i18n/config"
import { useWalletManager } from "@/hooks/use-wallet-manager"
import { generateArweaveWallet } from "@/lib/storage"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Wallet,
  Plus,
  Download,
  Lock,
  ShieldCheck,
  Key,
  Info,
  ShieldAlert,
  RefreshCcw,
} from "lucide-react"

export default function AccountPage() {
  const { t } = useTranslation()
  const walletManager = useWalletManager()
  const [password, setPassword] = useState("")

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error(t("unlock.errorLength"))
      return
    }
    const success = await walletManager.unlock(password)
    if (success) {
      setPassword("")
    }
  }

  const handleCreateArWallet = async () => {
    if (!walletManager.isUnlocked) {
      toast.error(t("history.errorLocked"))
      return
    }
    try {
      const { key, address } = await generateArweaveWallet()
      const alias = prompt(
        t("identities.aliasPrompt"),
        `Wallet-${address.slice(0, 4)}`,
      )
      if (!alias) return

      await walletManager.addWallet(key, alias)

      const blob = new Blob([JSON.stringify(key)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `arweave-key-${address}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t("identities.successGenerated"))
    } catch (error: any) {
      toast.error(t("identities.errorGenerate", { message: error.message }))
    }
  }

  const handleImportWallet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!walletManager.isUnlocked) {
      toast.error(t("history.errorLocked"))
      return
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const key = JSON.parse(reader.result as string)
          const alias = prompt(
            t("identities.aliasPrompt"),
            file.name.replace(".json", ""),
          )
          if (!alias) return
          await walletManager.addWallet(key, alias)
          toast.success(t("identities.successAdded", { alias }))
        } catch (error) {
          toast.error("Invalid Arweave key file")
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">
            {t("common.account")}
          </h2>
          <p className="text-slate-500">{t("identities.desc")}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-red-500"
          onClick={walletManager.resetVault}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Reset Vault
        </Button>
      </div>

      {!walletManager.isUnlocked ? (
        <Card className="overflow-hidden border-indigo-100 shadow-xl">
          <div
            className={`h-2 w-full ${walletManager.isInitialized ? "bg-linear-to-r from-indigo-600 to-violet-700" : "bg-linear-to-r from-amber-500 to-orange-600"}`}
          />
          <CardHeader className="pt-8">
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${walletManager.isInitialized ? "bg-indigo-100" : "bg-amber-100"}`}
            >
              {walletManager.isInitialized ? (
                <Lock className="h-6 w-6 text-indigo-600" />
              ) : (
                <ShieldAlert className="h-6 w-6 text-amber-600" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {walletManager.isInitialized
                ? t("unlock.title")
                : t("unlock.initTitle")}
            </CardTitle>
            <CardDescription className="text-base text-slate-500">
              {walletManager.isInitialized
                ? t("unlock.desc")
                : t("unlock.initDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <form onSubmit={handleUnlock} className="max-w-sm space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder={
                    walletManager.isInitialized
                      ? t("unlock.passwordPlaceholder")
                      : t("unlock.passwordPlaceholderInit")
                  }
                  className="h-12 border-slate-200 focus:ring-indigo-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className={`h-12 w-full rounded-xl text-base font-semibold shadow-lg ${walletManager.isInitialized ? "bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700" : "bg-amber-600 shadow-amber-100 hover:bg-amber-700"}`}
              >
                {walletManager.isInitialized
                  ? t("unlock.submit")
                  : t("unlock.submitInit")}
              </Button>
            </form>
            <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <Info className="h-5 w-5 shrink-0 text-slate-400" />
              <div className="text-sm leading-relaxed text-slate-500">
                <p className="mb-1 font-bold">{t("unlock.securityNote")}</p>
                <p>{t("unlock.warning")}</p>
                {!walletManager.isInitialized && (
                  <p className="mt-2 font-medium text-amber-700">
                    {t("unlock.forgotWarning")}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Card className="border-slate-200/60 shadow-sm md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Wallet className="h-5 w-5 text-indigo-600" />
                  {t("identities.title")}
                </CardTitle>
                <CardDescription>{t("identities.desc")}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateArWallet}
                >
                  <Plus className="mr-1 h-3 w-3" /> {t("identities.new")}
                </Button>
                <div className="relative">
                  <Button variant="outline" size="sm">
                    <Download className="mr-1 h-3 w-3" />{" "}
                    {t("identities.import")}
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportWallet}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {walletManager.wallets.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => walletManager.selectWallet(w)}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-all ${
                      walletManager.activeAddress === w.address
                        ? "border-indigo-600 bg-indigo-50/50"
                        : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          walletManager.activeAddress === w.address
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Key className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-bold text-slate-900">
                          {w.alias}
                        </div>
                        <div className="mt-0.5 max-w-[200px] truncate font-mono text-[10px] text-slate-500">
                          {w.address}
                        </div>
                      </div>
                    </div>
                    {walletManager.activeAddress === w.address && (
                      <ShieldCheck className="h-6 w-6 shrink-0 text-indigo-600" />
                    )}
                  </div>
                ))}
                {walletManager.wallets.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-400 italic">
                    {t("identities.noWallets")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-green-100 bg-green-50 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-bold tracking-wider text-green-800 uppercase">
                  <ShieldCheck className="h-4 w-4" />
                  Vault Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-green-700">
                  {t("common.activeIdentity")}
                </p>
              </CardContent>
            </Card>

            <div className="flex items-start gap-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
              <div className="text-xs leading-relaxed text-indigo-900">
                <p className="mb-1 font-bold">{t("common.securityNotice")}</p>
                <p>{t("common.securityNoticeDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
