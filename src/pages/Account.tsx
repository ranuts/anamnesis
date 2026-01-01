import { useState } from "react"
import { useTranslation } from "@/i18n/config"
import { useWalletManager } from "@/hooks/use-wallet-manager"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Wallet,
  Plus,
  Lock,
  ShieldCheck,
  Info,
  ShieldAlert,
  Copy,
  Eye,
  EyeOff,
  LogOut,
  ChevronRight,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trans } from "react-i18next"

export default function AccountPage() {
  const { t } = useTranslation()
  const walletManager = useWalletManager()
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [newWalletInput, setNewWalletInput] = useState("")
  const [showImportKey, setShowImportKey] = useState(false)
  const [newWalletAlias, setNewWalletAlias] = useState("")

  // 查看隐私相关
  const [showSensitiveDialog, setShowSensitiveDialog] = useState(false)
  const [sensitiveWallet, setSensitiveWallet] = useState<any>(null)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [decryptedInfo, setDecryptedInfo] = useState<{
    key: string
    mnemonic?: string
  } | null>(null)
  const [viewType, setViewType] = useState<"key" | "mnemonic">("key")

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await walletManager.unlock(password)
    if (success) setPassword("")
  }

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWalletInput || !newWalletAlias) {
      toast.error(t("identities.keyPlaceholder"))
      return
    }
    await walletManager.addWallet(newWalletInput, newWalletAlias)
    setNewWalletInput("")
    setNewWalletAlias("")
  }

  const handleCreateWallet = async (chain: any) => {
    const alias = prompt(
      t("identities.aliasPrompt"),
      `${chain.toUpperCase()}-Account`,
    )
    if (!alias) return
    await walletManager.createWallet(chain, alias)
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success(
      t("identities.copySuccess", {
        address: `${address.slice(0, 6)}...${address.slice(-4)}`,
      }),
    )
  }

  const handleShowSensitive = (wallet: any, type: "key" | "mnemonic") => {
    setSensitiveWallet(wallet)
    setConfirmPassword("")
    setDecryptedInfo(null)
    setViewType(type)
    setShowSensitiveDialog(true)
  }

  const verifyAndShow = async () => {
    try {
      const info = await walletManager.getDecryptedInfo(
        sensitiveWallet,
        confirmPassword,
      )
      setDecryptedInfo(info)
    } catch (e) {
      toast.error(t("unlock.incorrect"))
    }
  }

  const renderWalletList = (chain: string) => {
    const filtered = walletManager.wallets.filter((w) => w.chain === chain)
    if (filtered.length === 0) {
      return (
        <div className="rounded-xl border-2 border-dashed py-8 text-center text-slate-400 italic">
          {t("identities.emptyState", { chain })}
        </div>
      )
    }
    return (
      <div className="space-y-3">
        {filtered.map((w) => (
          <div
            key={w.id}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-indigo-600">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate font-bold text-slate-900">
                  {w.alias}
                </div>
                <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-slate-500">
                  <span className="max-w-[150px] truncate sm:max-w-none">
                    {w.address}
                  </span>
                  <button
                    onClick={() => copyAddress(w.address)}
                    className="p-1 hover:text-indigo-600"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShowSensitive(w, "key")}
                className="text-slate-400 hover:text-indigo-600"
              >
                <Eye className="mr-2 h-4 w-4" />
                {t("identities.viewSensitive")}
              </Button>
              {w.chain !== "arweave" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShowSensitive(w, "mnemonic")}
                  className="text-slate-400 hover:text-indigo-600"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {t("identities.mnemonic")}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">
            {t("common.account")}
          </h2>
          <p className="text-slate-500">{t("identities.multiChainDesc")}</p>
        </div>
        {walletManager.isUnlocked && (
          <Button
            variant="outline"
            size="sm"
            onClick={walletManager.logout}
            className="border-red-100 text-red-500 hover:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" /> {t("identities.logout")}
          </Button>
        )}
      </div>

      {!walletManager.isUnlocked ? (
        <Card className="overflow-hidden border-indigo-100 shadow-xl">
          <div className="h-2 w-full bg-linear-to-r from-indigo-600 to-violet-700" />
          <CardHeader className="pt-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
              <Lock className="h-8 w-8 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl">
              {t("unlock.accessTitle")}
            </CardTitle>
            <CardDescription className="mx-auto max-w-md text-base">
              {t("unlock.accessDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-12">
            <form
              onSubmit={handleUnlock}
              className="mx-auto max-w-sm space-y-4"
            >
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("unlock.passwordPlaceholder")}
                  className="h-12 rounded-xl border-slate-200 text-center text-lg focus:ring-indigo-500 pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-indigo-600 text-lg font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700"
              >
                {t("unlock.submit")} <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Tabs defaultValue="ethereum" className="w-full">
              <TabsList className="mb-6 h-auto w-full flex-wrap justify-start rounded-xl bg-slate-100 p-1">
                {["ethereum", "bitcoin", "solana", "sui", "arweave"].map(
                  (chain) => (
                    <TabsTrigger
                      key={chain}
                      value={chain}
                      className="rounded-lg px-6 py-2.5 capitalize data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      {chain}
                    </TabsTrigger>
                  ),
                )}
              </TabsList>
              <TabsContent value="ethereum">
                {renderWalletList("ethereum")}
              </TabsContent>
              <TabsContent value="bitcoin">
                {renderWalletList("bitcoin")}
              </TabsContent>
              <TabsContent value="solana">
                {renderWalletList("solana")}
              </TabsContent>
              <TabsContent value="sui">{renderWalletList("sui")}</TabsContent>
              <TabsContent value="arweave">
                {renderWalletList("arweave")}
              </TabsContent>
            </Tabs>

            <Card className="overflow-hidden border-slate-200/60 shadow-sm">
              <Tabs defaultValue="import">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-2">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-700">
                    <Plus className="h-5 w-5" /> {t("identities.addNew")}
                  </CardTitle>
                  <TabsList className="h-9 bg-slate-200/50 p-1">
                    <TabsTrigger value="import" className="px-3 py-1.5 text-xs">
                      {t("identities.import")}
                    </TabsTrigger>
                    <TabsTrigger value="create" className="px-3 py-1.5 text-xs">
                      {t("identities.new")}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <CardContent className="p-6">
                  <TabsContent value="import" className="mt-0">
                    <form onSubmit={handleAddWallet} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">
                            {t("identities.aliasLabel")}
                          </label>
                          <Input
                            placeholder={t("identities.aliasPlaceholder")}
                            value={newWalletAlias}
                            onChange={(e) => setNewWalletAlias(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">
                            {t("identities.keyLabel")}
                          </label>
                          <div className="relative">
                            <Input
                              type={showImportKey ? "text" : "password"}
                              placeholder={t("identities.keyPlaceholder")}
                              value={newWalletInput}
                              onChange={(e) => setNewWalletInput(e.target.value)}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowImportKey(!showImportKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                              {showImportKey ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="h-11 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700"
                      >
                        {t("identities.addSubmit")}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="create" className="mt-0">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {[
                        {
                          id: "ethereum",
                          name: "Ethereum / Base / Hyper",
                          icon: <Wallet className="h-4 w-4" />,
                        },
                        {
                          id: "bitcoin",
                          name: "Bitcoin",
                          icon: <Wallet className="h-4 w-4" />,
                        },
                        {
                          id: "solana",
                          name: "Solana",
                          icon: <Wallet className="h-4 w-4" />,
                        },
                        {
                          id: "sui",
                          name: "Sui",
                          icon: <Wallet className="h-4 w-4" />,
                        },
                        {
                          id: "arweave",
                          name: "Arweave",
                          icon: <Wallet className="h-4 w-4" />,
                        },
                      ].map((chain) => (
                        <Button
                          key={chain.id}
                          variant="outline"
                          onClick={() => handleCreateWallet(chain.id)}
                          className="flex h-20 flex-col gap-2 rounded-xl border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/30"
                        >
                          <div className="rounded-lg bg-slate-50 p-2 text-slate-600 group-hover:text-indigo-600">
                            {chain.icon}
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            {chain.name}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2 text-green-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-green-900">
                  {t("identities.activeVault")}
                </h3>
              </div>
              <div className="font-mono text-xs break-all text-green-700 opacity-70">
                ID: {walletManager.vaultId}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-green-800">
                {t("identities.vaultDesc")}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
                <Info className="h-4 w-4 text-indigo-500" />{" "}
                {t("identities.securityInfo")}
              </h3>
              <ul className="space-y-3 text-xs leading-relaxed text-slate-500">
                <li>• {t("identities.securityItem1")}</li>
                <li>• {t("identities.securityItem2")}</li>
                <li>• {t("identities.securityItem3")}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Sensitive Info Dialog */}
      <Dialog open={showSensitiveDialog} onOpenChange={setShowSensitiveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              {viewType === "key"
                ? t("identities.viewSensitiveTitle")
                : t("identities.mnemonic")}
            </DialogTitle>
            <DialogDescription>
              <Trans
                i18nKey={
                  viewType === "key"
                    ? "identities.viewSensitiveDesc"
                    : "identities.mnemonicDesc"
                }
                values={{ alias: sensitiveWallet?.alias }}
                components={{ strong: <strong /> }}
              />
            </DialogDescription>
          </DialogHeader>

          {!decryptedInfo ? (
            <div className="space-y-4 py-4">
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("unlock.passwordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Button onClick={verifyAndShow} className="w-full bg-indigo-600">
                {t("identities.verifyPassword")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="rounded-xl bg-slate-900 p-4">
                <p className="font-mono text-xs leading-relaxed break-all text-green-400">
                  {viewType === "key"
                    ? decryptedInfo.key
                    : decryptedInfo.mnemonic || t("identities.noMnemonic")}
                </p>
              </div>
              <Button
                onClick={() =>
                  copyAddress(
                    viewType === "key"
                      ? decryptedInfo.key
                      : decryptedInfo.mnemonic || "",
                  )
                }
                variant="outline"
                className="w-full"
              >
                <Copy className="mr-2 h-4 w-4" /> {t("common.copy")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
