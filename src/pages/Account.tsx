import { useState, useEffect } from "react"
import { useTranslation } from "@/i18n/config"
import { useWalletManager } from "@/hooks/use-wallet-manager"
import { toast } from "sonner"
import { useAccount, useDisconnect } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { getBalance, type BalanceResult } from "@/lib/balance"
import { db } from "@/lib/db"
import {
  ArweaveIcon,
  EthereumIcon,
  SolanaIcon,
  BitcoinIcon,
  SuiIcon,
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
      // 如果当前使用的是外部账户，清除保存的状态
      if (!walletManager.activeAddress && walletManager.vaultId) {
        try {
          await db.vault.delete(
            `use_external_${walletManager.vaultId}`,
          )
        } catch (e) {
          console.error("Failed to clear external account state:", e)
        }
      }
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

  // 余额状态
  const [balances, setBalances] = useState<
    Record<string, BalanceResult | null>
  >({})
  const [loadingBalances, setLoadingBalances] = useState<
    Record<string, boolean>
  >({})

  // 获取所有账户的余额
  useEffect(() => {
    if (!walletManager.isUnlocked || walletManager.wallets.length === 0) {
      return
    }

    const fetchBalances = async () => {
      const promises = walletManager.wallets.map(async (wallet) => {
        const key = `${wallet.chain}-${wallet.address}`
        
        // 如果已经有余额数据，跳过
        if (balances[key] !== undefined) {
          return
        }

        setLoadingBalances((prev) => ({ ...prev, [key]: true }))
        try {
          const balance = await getBalance(wallet.chain, wallet.address)
          setBalances((prev) => ({ ...prev, [key]: balance }))
        } catch (error) {
          console.error(`Failed to fetch balance for ${wallet.address}:`, error)
          setBalances((prev) => ({
            ...prev,
            [key]: {
              balance: "0",
              formatted: "0",
              symbol: wallet.chain.toUpperCase(),
              error: "Failed to fetch",
            },
          }))
        } finally {
          setLoadingBalances((prev) => ({ ...prev, [key]: false }))
        }
      })

      await Promise.all(promises)
    }

    fetchBalances()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletManager.isUnlocked, walletManager.wallets])

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

  // 获取外部连接的账户信息
  const getExternalAccounts = () => {
    const externalAccounts: Array<{
      id: string
      chain: string
      address: string
      alias: string
      isExternal: true
      provider?: string
    }> = []

    // EVM 账户
    if (isPaymentConnected && paymentAddress) {
      externalAccounts.push({
        id: `external-evm-${paymentAddress}`,
        chain: "ethereum",
        address: paymentAddress,
        alias: "外部连接账户",
        isExternal: true,
        provider: "EVM",
      })
    }

    // Arweave 账户
    if (isArConnected && arAddress) {
      externalAccounts.push({
        id: `external-arweave-${arAddress}`,
        chain: "arweave",
        address: arAddress,
        alias: "外部连接账户",
        isExternal: true,
        provider: "ArConnect",
      })
    }

    return externalAccounts
  }

  // 获取外部账户余额
  useEffect(() => {
    const externalAccounts = getExternalAccounts()
    if (externalAccounts.length === 0) return

    const fetchExternalBalances = async () => {
      for (const account of externalAccounts) {
        const key = `external-${account.chain}-${account.address}`
        if (loadingBalances[key] || balances[key] !== undefined) {
          continue
        }

        setLoadingBalances((prev) => ({ ...prev, [key]: true }))
        try {
          const balance = await getBalance(account.chain, account.address)
          setBalances((prev) => ({ ...prev, [key]: balance }))
        } catch (error) {
          console.error(`Failed to fetch balance for external ${account.address}:`, error)
          setBalances((prev) => ({
            ...prev,
            [key]: {
              balance: "0",
              formatted: "0",
              symbol: account.chain.toUpperCase(),
              error: "Failed to fetch",
            },
          }))
        } finally {
          setLoadingBalances((prev) => ({ ...prev, [key]: false }))
        }
      }
    }

    fetchExternalBalances()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaymentConnected, paymentAddress, isArConnected, arAddress])

  const renderAccountList = (chain: string) => {
    // 本地账户
    const localAccounts = walletManager.wallets.filter((w) => w.chain === chain)
    
    // 外部连接账户
    const externalAccounts = getExternalAccounts().filter(
      (acc) => acc.chain === chain,
    )

    const allAccounts = [
      ...localAccounts.map((w) => ({ ...w, isExternal: false })),
      ...externalAccounts.map((acc) => ({
        ...acc,
        // 为外部账户生成更好的显示名称
        alias:
          acc.chain === "ethereum"
            ? "EVM 钱包"
            : acc.chain === "arweave"
              ? "ArConnect 钱包"
              : "外部连接账户",
      })),
    ]

    // 渲染连接外部账户按钮
    const renderConnectButton = () => {
      if (chain === "ethereum" && !isPaymentConnected) {
      return (
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-indigo-300 hover:bg-indigo-50/30">
                <Button
                  onClick={openConnectModal}
                  variant="ghost"
                  className="h-auto w-full flex-col gap-2 p-0 text-slate-600 hover:text-indigo-600"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-xs font-semibold">连接 EVM 钱包</span>
                </Button>
        </div>
            )}
          </ConnectButton.Custom>
      )
    }
      if (chain === "arweave" && !isArConnected) {
    return (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-indigo-300 hover:bg-indigo-50/30">
            <Button
              onClick={connectArweave}
              variant="ghost"
              className="h-auto w-full flex-col gap-2 p-0 text-slate-600 hover:text-indigo-600"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs font-semibold">连接 ArConnect</span>
            </Button>
        </div>
        )
      }
      return null
    }

    if (allAccounts.length === 0) {
      const connectBtn = renderConnectButton()
      return (
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
            <Wallet className="mx-auto h-8 w-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-400 italic">
              {t("identities.emptyState", { chain })}
            </p>
          </div>
          {connectBtn}
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {allAccounts.map((account) => {
          const key = account.isExternal
            ? `external-${account.chain}-${account.address}`
            : `${account.chain}-${account.address}`
          const balance = balances[key]
          const loading = loadingBalances[key]
          // 判断是否激活：本地账户检查 activeAddress，外部账户检查是否有本地账户激活（如果没有本地账户激活，外部账户就是激活的）
          const isActive = account.isExternal
            ? !walletManager.activeAddress // 外部账户激活：没有本地账户激活
            : walletManager.activeAddress === account.address // 本地账户激活：地址匹配

          return (
            <div
              key={account.id || (account as any).id}
              className={`group relative overflow-hidden rounded-xl border transition-all ${
                isActive
                  ? "border-indigo-300 bg-gradient-to-br from-indigo-50 to-indigo-50/50 shadow-md"
                  : account.isExternal
                    ? "border-blue-200 bg-blue-50/30 hover:border-blue-300 hover:shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 h-full w-1 bg-indigo-600" />
              )}
              {account.isExternal && (
                <div className="absolute left-0 top-0 h-full w-1 bg-blue-500" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                          : account.isExternal
                            ? "bg-blue-100 text-blue-600 group-hover:bg-blue-200"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}
                    >
                      {getChainIcon(account.chain)}
                </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="truncate font-bold text-slate-900">
                          {account.isExternal
                            ? account.alias
                            : (account as any).alias}
                        </h3>
                        {isActive && (
                          <span className="shrink-0 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                            {t("identities.currentAccount")}
                    </span>
                        )}
                        {account.isExternal && (
                          <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                            外部连接
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
                        <span className="truncate">{account.address}</span>
                    <button
                          onClick={() => copyAddress(account.address)}
                          className="shrink-0 p-1 text-slate-400 transition-colors hover:text-indigo-600"
                          title={t("common.copy")}
                    >
                          <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                      <div className="flex items-center gap-2">
                        {loading ? (
                          <span className="text-xs text-slate-400 italic">
                            {t("common.loading")}
                          </span>
                        ) : balance ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-bold text-indigo-600">
                              {balance.formatted}
                            </span>
                            <span className="text-xs font-medium text-slate-500 uppercase">
                              {balance.symbol}
                            </span>
                </div>
                        ) : null}
              </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                        {account.isExternal ? (
                      // 外部账户操作按钮
                      <>
                        {!isActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                            onClick={() => {
                              // 清除本地账户激活状态，使外部账户成为激活账户
                              walletManager.clearActiveWallet()
                              toast.success("已切换到外部账户")
                            }}
                            className="h-8 px-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                    {t("identities.activate")}
                  </Button>
                )}
                        {account.chain === "ethereum" && isPaymentConnected ? (
                          <ConnectButton.Custom>
                            {({ openAccountModal }) => (
                <Button
                  variant="ghost"
                  size="sm"
                                onClick={openAccountModal}
                                className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                                title="管理账户"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </ConnectButton.Custom>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (account.chain === "ethereum") {
                              disconnectEVM()
                              // 如果当前使用的是外部账户，清除保存的状态
                              if (!walletManager.activeAddress && walletManager.vaultId) {
                                try {
                                  await db.vault.delete(
                                    `use_external_${walletManager.vaultId}`,
                                  )
                                } catch (e) {
                                  console.error("Failed to clear external account state:", e)
                                }
                              }
                            } else if (account.chain === "arweave") {
                              disconnectArweave()
                            }
                          }}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                          title="断开连接"
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      // 本地账户操作按钮
                      <>
                        {!isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              walletManager.selectWallet(account.address)
                            }
                            className="h-8 px-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                            {t("identities.activate")}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowSensitive(account, "key")}
                          className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                          title={t("identities.viewSensitive")}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                        {account.chain !== "arweave" && (
                  <Button
                    variant="ghost"
                    size="sm"
                            onClick={() =>
                              handleShowSensitive(account, "mnemonic")
                            }
                            className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                            title={t("identities.mnemonic")}
                  >
                    <Lock className="h-4 w-4" />
                  </Button>
                        )}
                      </>
                )}
              </div>
            </div>
        </div>
            </div>
          )
        })}
        {/* 连接外部账户按钮 */}
        {renderConnectButton()}
      </div>
    )
  }

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
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
                <CardTitle className="text-base text-slate-700">
                  {t("identities.title")}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {t("identities.desc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
            <Tabs defaultValue="ethereum" className="w-full">
                  <TabsList className="mx-4 mt-4 mb-0 h-auto w-auto flex-wrap justify-start rounded-lg bg-slate-100 p-1">
                {["ethereum", "bitcoin", "solana", "sui", "arweave"].map(
                  (chain) => (
                    <TabsTrigger
                      key={chain}
                      value={chain}
                          className="rounded-md px-4 py-2 text-xs font-semibold capitalize data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                    >
                      {chain}
                    </TabsTrigger>
                  ),
                )}
              </TabsList>
              <TabsContent value="ethereum" className="px-4 pb-4 pt-4">
                {renderAccountList("ethereum")}
              </TabsContent>
              <TabsContent value="bitcoin" className="px-4 pb-4 pt-4">
                {renderAccountList("bitcoin")}
              </TabsContent>
              <TabsContent value="solana" className="px-4 pb-4 pt-4">
                {renderAccountList("solana")}
              </TabsContent>
              <TabsContent value="sui" className="px-4 pb-4 pt-4">
                {renderAccountList("sui")}
              </TabsContent>
              <TabsContent value="arweave" className="px-4 pb-4 pt-4">
                {renderAccountList("arweave")}
              </TabsContent>
            </Tabs>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-slate-700">
                  <Plus className="h-4 w-4 text-indigo-600" />
                  {t("identities.addNew")}
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="import" className="w-full">
                  <TabsList className="mx-4 mt-4 mb-0 h-auto w-auto rounded-lg bg-slate-100 p-1">
                    <TabsTrigger
                      value="import"
                      className="rounded-md px-4 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                    >
                      {t("identities.import")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="create"
                      className="rounded-md px-4 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                    >
                      {t("identities.new")}
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-6 pt-4">
                  <TabsContent value="import" className="mt-0">
                    <form onSubmit={handleAddAccount} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-700">
                            {t("identities.aliasLabel")}
                          </label>
                          <Input
                            placeholder={t("identities.aliasPlaceholder")}
                            value={newAccountAlias}
                            onChange={(e) => setNewAccountAlias(e.target.value)}
                              className="rounded-lg"
                          />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-700">
                            {t("identities.keyLabel")}
                          </label>
                          <div className="relative">
                            <Input
                              type={showImportKey ? "text" : "password"}
                              placeholder={t("identities.keyPlaceholder")}
                              value={newAccountInput}
                              onChange={(e) => setNewAccountInput(e.target.value)}
                                className="pr-10 rounded-lg"
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
                          className="h-10 w-full rounded-lg bg-indigo-600 font-semibold hover:bg-indigo-700"
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
                            name: "Ethereum",
                            icon: <EthereumIcon className="h-5 w-5" />,
                        },
                        {
                          id: "bitcoin",
                          name: "Bitcoin",
                            icon: <BitcoinIcon className="h-5 w-5" />,
                        },
                        {
                          id: "solana",
                          name: "Solana",
                            icon: <SolanaIcon className="h-5 w-5" />,
                        },
                        {
                          id: "sui",
                          name: "Sui",
                            icon: <SuiIcon className="h-5 w-5" />,
                        },
                        {
                          id: "arweave",
                          name: "Arweave",
                            icon: <ArweaveIcon className="h-5 w-5" />,
                        },
                      ].map((chain) => (
                        <Button
                          key={chain.id}
                          variant="outline"
                          onClick={() => handleCreateAccount(chain.id)}
                            className="flex h-24 flex-col gap-2 rounded-lg border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all"
                        >
                            <div className="rounded-lg bg-slate-50 p-2 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            {chain.icon}
                          </div>
                            <span className="text-xs font-semibold text-slate-700">
                            {chain.name}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                  </div>
              </Tabs>
              </CardContent>
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
