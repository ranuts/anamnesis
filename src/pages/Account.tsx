import { useState, useEffect } from "react"
import { useTranslation } from "@/i18n/config"
import { useWalletManager } from "@/hooks/use-wallet-manager"
import { toast } from "sonner"
import { useAccount, useDisconnect } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import {
  ArweaveIcon,
  EthereumIcon,
  SolanaIcon,
  BitcoinIcon,
  SuiIcon,
  IrysIcon,
} from "@/components/icons"
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
  Settings2,
  ExternalLink,
  Unlink,
  UserCheck,
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
  const { address: paymentAddress, isConnected: isPaymentConnected } =
    useAccount()
  const { disconnect: disconnectEVM } = useDisconnect()

  // Arweave 外部账户状态
  const [arAddress, setArAddress] = useState<string | null>(null)
  const [isArConnected, setIsArConnected] = useState(false)

  const checkArConnect = async () => {
    if (window.arweaveWallet) {
      try {
        const addr = await window.arweaveWallet.getActiveAddress()
        setArAddress(addr)
        setIsArConnected(true)
      } catch (e) {
        setIsArConnected(false)
        setArAddress(null)
      }
    }
  }

  useEffect(() => {
    checkArConnect()
    // 监听 ArConnect 切换账号
    window.addEventListener("walletSwitch", checkArConnect)
    return () => window.removeEventListener("walletSwitch", checkArConnect)
  }, [])

  const connectArweave = async () => {
    if (!window.arweaveWallet) {
      window.open("https://www.arconnect.io/", "_blank")
      return
    }
    try {
      await window.arweaveWallet.connect([
        "ACCESS_ADDRESS",
        "ACCESS_ALL_ADDRESSES",
        "SIGN_TRANSACTION",
      ])
      await checkArConnect()
      toast.success(t("identities.paymentConnected"))
    } catch (e) {
      toast.error("ArConnect connection failed")
    }
  }

  const disconnectArweave = async () => {
    if (window.arweaveWallet) {
      await window.arweaveWallet.disconnect()
      setIsArConnected(false)
      setArAddress(null)
      toast.success(t("identities.disconnectProvider"))
    }
  }

  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [newAccountInput, setNewAccountInput] = useState("")
  const [showImportKey, setShowImportKey] = useState(false)
  const [newAccountAlias, setNewAccountAlias] = useState("")

  // 查看隐私相关
  const [showSensitiveDialog, setShowSensitiveDialog] = useState(false)
  const [sensitiveAccount, setSensitiveAccount] = useState<any>(null)
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

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccountInput || !newAccountAlias) {
      toast.error(t("identities.keyPlaceholder"))
      return
    }
    await walletManager.addWallet(newAccountInput, newAccountAlias)
    setNewAccountInput("")
    setNewAccountAlias("")
  }

  const handleCreateAccount = async (chain: any) => {
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

  const handleShowSensitive = (account: any, type: "key" | "mnemonic") => {
    setSensitiveAccount(account)
    setConfirmPassword("")
    setDecryptedInfo(null)
    setViewType(type)
    setShowSensitiveDialog(true)
  }

  const verifyAndShow = async () => {
    try {
      const info = await walletManager.getDecryptedInfo(
        sensitiveAccount,
        confirmPassword,
      )
      setDecryptedInfo(info)
    } catch (e) {
      toast.error(t("unlock.incorrect"))
    }
  }

  const renderAccountList = (chain: string) => {
    const filtered = walletManager.wallets.filter((w) => w.chain === chain)
    if (filtered.length === 0) {
      return (
        <div className="rounded-xl border-2 border-dashed py-8 text-center text-slate-400 italic">
          {t("identities.emptyState", { chain })}
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {t("identities.title")}
          </h4>
          <span className="text-[10px] font-medium text-slate-400">
            {filtered.length} {t("identities.accountLabel")}
          </span>
        </div>
        <div className="space-y-3">
          {filtered.map((w) => (
            <div
              key={w.id}
              className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                walletManager.activeAddress === w.address
                  ? "border-indigo-200 bg-indigo-50/30 shadow-sm"
                  : "border-slate-100 bg-white hover:shadow-sm"
              }`}
            >
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                    walletManager.activeAddress === w.address
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-50 text-slate-400"
                  }`}
                >
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-bold text-slate-900">
                      {w.alias}
                    </div>
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
                {walletManager.activeAddress !== w.address && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => walletManager.selectWallet(w.address)}
                    className="h-8 px-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                    {t("identities.activate")}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShowSensitive(w, "key")}
                  className="text-slate-400 hover:text-indigo-600"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {w.chain !== "arweave" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShowSensitive(w, "mnemonic")}
                    className="text-slate-400 hover:text-indigo-600"
                  >
                    <Lock className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const activeAccount = walletManager.wallets.find(
    (w) => w.address === walletManager.activeAddress,
  )

  const getChainIcon = (chain?: string) => {
    switch (chain?.toLowerCase()) {
      case "ethereum":
        return <EthereumIcon className="h-6 w-6" />
      case "solana":
        return <SolanaIcon className="h-6 w-6" />
      case "bitcoin":
        return <BitcoinIcon className="h-6 w-6" />
      case "sui":
        return <SuiIcon className="h-6 w-6" />
      case "arweave":
        return <ArweaveIcon className="h-6 w-6" />
      default:
        return <UserCheck className="h-6 w-6" />
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8 px-4 sm:px-6">
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
            {/* Current Account Summary Card */}
            <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/30 p-6 shadow-xs">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                  {getChainIcon(activeAccount?.chain)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                    {t("identities.currentAccount")}
                  </div>
                  {activeAccount ? (
                    <div className="mt-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xl font-bold text-slate-900">
                          {activeAccount.alias}
                        </span>
                        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 uppercase">
                          {activeAccount.chain}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 font-mono text-sm text-slate-500">
                        <span className="truncate">{activeAccount.address}</span>
                        <button
                          onClick={() => copyAddress(activeAccount.address)}
                          className="hover:text-indigo-600"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-lg font-medium text-slate-400 italic">
                      {t("identities.noActiveAccount")}
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                {renderAccountList("ethereum")}
              </TabsContent>
              <TabsContent value="bitcoin">
                {renderAccountList("bitcoin")}
              </TabsContent>
              <TabsContent value="solana">
                {renderAccountList("solana")}
              </TabsContent>
              <TabsContent value="sui">{renderAccountList("sui")}</TabsContent>
              <TabsContent value="arweave">
                {renderAccountList("arweave")}
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
                    <form onSubmit={handleAddAccount} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">
                            {t("identities.aliasLabel")}
                          </label>
                          <Input
                            placeholder={t("identities.aliasPlaceholder")}
                            value={newAccountAlias}
                            onChange={(e) => setNewAccountAlias(e.target.value)}
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
                              value={newAccountInput}
                              onChange={(e) => setNewAccountInput(e.target.value)}
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
                          onClick={() => handleCreateAccount(chain.id)}
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
            {/* Payment Wallets (External) */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Settings2 className="h-3 w-3" />
                {t("identities.paymentMethod")}
              </h4>

              {/* EVM Provider (Irys) */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <IrysIcon className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-bold text-slate-600">
                      {t("identities.paymentProviderEVM")}
                    </span>
                  </div>
                  {isPaymentConnected && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase">
                      <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>

                <div className="p-4">
                  {!isPaymentConnected ? (
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <Button
                          onClick={openConnectModal}
                          variant="outline"
                          className="h-9 w-full rounded-xl border-dashed border-slate-300 text-xs font-bold text-slate-500 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Plus className="mr-2 h-3.5 w-3.5" />
                          {t("identities.connectProvider", { name: "EVM" })}
                        </Button>
                      )}
                    </ConnectButton.Custom>
                  ) : (
                    <ConnectButton.Custom>
                      {({ account, chain, openAccountModal }) => (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {chain?.iconUrl && (
                                <img
                                  src={chain.iconUrl}
                                  alt=""
                                  className="h-5 w-5 rounded-full"
                                />
                              )}
                              <span className="text-xs font-bold text-slate-700">
                                {account.displayName}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-indigo-600">
                              {account.displayBalance}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={openAccountModal}
                              className="h-7 flex-1 rounded-lg bg-slate-50 text-[10px] font-bold text-slate-500 hover:bg-slate-100"
                            >
                              <ExternalLink className="mr-1.5 h-3 w-3" />
                              {t("identities.managePayment")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => disconnectEVM()}
                              className="h-7 w-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50"
                            >
                              <Unlink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </ConnectButton.Custom>
                  )}
                </div>
              </div>

              {/* Arweave Provider (Native) */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <ArweaveIcon className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-bold text-slate-600">
                      {t("identities.paymentProviderArweave")}
                    </span>
                  </div>
                  {isArConnected && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase">
                      <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>

                <div className="p-4">
                  {!isArConnected ? (
                    <Button
                      onClick={connectArweave}
                      variant="outline"
                      className="h-9 w-full rounded-xl border-dashed border-slate-300 text-xs font-bold text-slate-500 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      {t("identities.connectProvider", { name: "ArConnect" })}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-indigo-50 flex items-center justify-center">
                            <ArweaveIcon className="h-3 w-3" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            {arAddress?.slice(0, 6)}...{arAddress?.slice(-4)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyAddress(arAddress || "")}
                          className="h-7 flex-1 rounded-lg bg-slate-50 text-[10px] font-bold text-slate-500 hover:bg-slate-100"
                        >
                          <Copy className="mr-1.5 h-3 w-3" />
                          {t("common.copy")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={disconnectArweave}
                          className="h-7 w-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50"
                        >
                          <Unlink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <p className="px-4 text-[10px] leading-relaxed text-slate-400 italic text-center">
                {t("identities.paymentDesc")}
              </p>
            </div>

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
                values={{ alias: sensitiveAccount?.alias }}
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
