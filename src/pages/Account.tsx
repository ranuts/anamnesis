import { useState, useEffect } from "react"
import { useTranslation } from "@/i18n/config"
import { useWalletManager } from "@/hooks/use-wallet-manager"
import { toast } from "sonner"
import { useAccount, useDisconnect, useConnections } from "wagmi"
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
  const {
    address: paymentAddress,
    isConnected: isPaymentConnected,
    connector,
  } = useAccount()
  const { disconnect: disconnectEVM } = useDisconnect()
  const connections = useConnections()

  // Arweave 外部账户状态
  const [arAddress, setArAddress] = useState<string | null>(null)
  const [isArConnected, setIsArConnected] = useState(false)

  // Solana 外部账户状态
  const [solAddress, setSolAddress] = useState<string | null>(null)
  const [isSolConnected, setIsSolConnected] = useState(false)

  // Sui 外部账户状态
  const [suiAddress, setSuiAddress] = useState<string | null>(null)
  const [isSuiConnected, setIsSuiConnected] = useState(false)

  // 所有 EVM 账户地址（从钱包提供者获取）
  const [allEVMAddresses, setAllEVMAddresses] = useState<string[]>([])
  // 存储所有曾经连接过的账户地址（用于追踪多个账户）
  const [seenEVMAddresses, setSeenEVMAddresses] = useState<Set<string>>(
    new Set(),
  )

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

  // 检查 Solana 钱包连接
  const checkSolConnect = async () => {
    const solana = (window as any).solana
    if (solana && solana.isPhantom) {
      try {
        const resp = await solana.connect({ onlyIfTrusted: false })
        if (resp?.publicKey) {
          setSolAddress(resp.publicKey.toString())
          setIsSolConnected(true)
        }
      } catch (e) {
        setIsSolConnected(false)
        setSolAddress(null)
      }
    } else {
      setIsSolConnected(false)
      setSolAddress(null)
    }
  }

  // 检查 Sui 钱包连接
  const checkSuiConnect = async () => {
    const suiWallet = (window as any).suiWallet
    if (suiWallet) {
      try {
        const accounts = await suiWallet.getAccounts()
        if (accounts && accounts.length > 0) {
          setSuiAddress(accounts[0])
          setIsSuiConnected(true)
        }
      } catch (e) {
        setIsSuiConnected(false)
        setSuiAddress(null)
      }
    } else {
      setIsSuiConnected(false)
      setSuiAddress(null)
    }
  }

  useEffect(() => {
    checkSolConnect()
    checkSuiConnect()
  }, [])

  // 连接 Solana 钱包
  const connectSolana = async () => {
    const solana = (window as any).solana
    if (!solana || !solana.isPhantom) {
      toast.error("请先安装 Phantom 钱包", {
        action: {
          label: "安装",
          onClick: () => window.open("https://phantom.app/", "_blank"),
        },
      })
      return
    }
    try {
      const resp = await solana.connect()
      if (resp?.publicKey) {
        setSolAddress(resp.publicKey.toString())
        setIsSolConnected(true)
        toast.success("Solana 钱包连接成功")
      }
    } catch (e: any) {
      if (e.code !== 4001) {
        // 用户拒绝连接
        toast.error("连接失败：" + (e.message || "未知错误"))
      }
    }
  }

  // 断开 Solana 钱包
  const disconnectSolana = async () => {
    const solana = (window as any).solana
    if (solana) {
      try {
        await solana.disconnect()
        setSolAddress(null)
        setIsSolConnected(false)
        toast.success("已断开 Solana 钱包")
      } catch (e) {
        console.error("Failed to disconnect Solana:", e)
      }
    }
  }

  // 连接 Sui 钱包
  const connectSui = async () => {
    const suiWallet = (window as any).suiWallet
    if (!suiWallet) {
      toast.error("请先安装 Sui Wallet", {
        action: {
          label: "安装",
          onClick: () =>
            window.open(
              "https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil",
              "_blank",
            ),
        },
      })
      return
    }
    try {
      await suiWallet.requestPermissions()
      const accounts = await suiWallet.getAccounts()
      if (accounts && accounts.length > 0) {
        setSuiAddress(accounts[0])
        setIsSuiConnected(true)
        toast.success("Sui 钱包连接成功")
      }
    } catch (e: any) {
      if (e.code !== 4001) {
        toast.error("连接失败：" + (e.message || "未知错误"))
      }
    }
  }

  // 断开 Sui 钱包
  const disconnectSui = async () => {
    const suiWallet = (window as any).suiWallet
    if (suiWallet) {
      try {
        await suiWallet.disconnect()
        setSuiAddress(null)
        setIsSuiConnected(false)
        toast.success("已断开 Sui 钱包")
      } catch (e) {
        console.error("Failed to disconnect Sui:", e)
      }
    }
  }

  // 获取所有 EVM 账户地址
  useEffect(() => {
    const fetchAllEVMAddresses = async () => {
      if (!isPaymentConnected || !connector) {
        setAllEVMAddresses([])
        return
      }

      const addresses = new Set<string>()

      // 添加当前激活的账户
      if (paymentAddress) {
        addresses.add(paymentAddress)
      }

      // 添加所有曾经见过的账户
      seenEVMAddresses.forEach((addr) => {
        addresses.add(addr)
      })

      // 尝试从连接中获取所有账户
      if (connections && Array.isArray(connections) && connections.length > 0) {
        connections.forEach((conn) => {
          if (
            conn.accounts &&
            Array.isArray(conn.accounts) &&
            conn.accounts.length > 0
          ) {
            conn.accounts.forEach((acc: { address: string }) => {
              if (acc && acc.address) {
                addresses.add(acc.address)
              }
            })
          }
        })
      }

      // 尝试从钱包提供者获取所有账户（如 MetaMask）
      try {
        if ("provider" in connector && connector.provider) {
          const provider = (connector as any).provider
          if (provider && typeof provider.request === "function") {
            // 使用 eth_accounts 获取已授权的账户
            const accounts = await provider.request({ method: "eth_accounts" })
            if (accounts && Array.isArray(accounts)) {
              accounts.forEach((addr: string) => {
                if (addr && typeof addr === "string") {
                  addresses.add(addr)
                }
              })
            }
          }
        }
      } catch (e) {
        // 忽略错误，继续使用已获取的账户
        console.debug("Failed to fetch all EVM accounts:", e)
      }

      // 更新已见过的账户集合
      setSeenEVMAddresses((prev) => {
        const newSet = new Set(prev)
        addresses.forEach((addr) => newSet.add(addr))
        return newSet
      })

      setAllEVMAddresses(Array.from(addresses))
    }

    fetchAllEVMAddresses()

    // 监听账户变化（某些钱包会触发 accountsChanged 事件）
    if (connector && "provider" in connector && connector.provider) {
      const provider = (connector as any).provider
      if (provider && typeof provider.on === "function") {
        const handleAccountsChanged = (accounts: string[]) => {
          console.log("Accounts changed:", accounts)
          // 更新已见过的账户集合
          setSeenEVMAddresses((prev) => {
            const newSet = new Set(prev)
            if (accounts && Array.isArray(accounts)) {
              accounts.forEach((addr: string) => {
                if (addr && typeof addr === "string") {
                  newSet.add(addr)
                }
              })
            }
            return newSet
          })
          fetchAllEVMAddresses()
        }

        provider.on("accountsChanged", handleAccountsChanged)

        return () => {
          if (provider && typeof provider.removeListener === "function") {
            provider.removeListener("accountsChanged", handleAccountsChanged)
          }
        }
      }
    }
  }, [isPaymentConnected, paymentAddress, connector, connections])

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
          await db.vault.delete(`use_external_${walletManager.vaultId}`)
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
  // 余额显示状态（默认隐藏）
  const [showBalances, setShowBalances] = useState<Record<string, boolean>>({})

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
      connectionId?: string
    }> = []

    // EVM 账户 - 获取所有连接的账户
    if (
      isPaymentConnected &&
      allEVMAddresses &&
      Array.isArray(allEVMAddresses) &&
      allEVMAddresses.length > 0
    ) {
      // 为每个地址创建账户对象
      allEVMAddresses.forEach((address) => {
        if (address && typeof address === "string") {
          const isActive =
            address.toLowerCase() === paymentAddress?.toLowerCase()
          externalAccounts.push({
            id: `external-evm-${address}`,
            chain: "ethereum",
            address: address,
            alias: isActive
              ? "EVM 钱包 (当前)"
              : `EVM 钱包 ${address.slice(0, 6)}...${address.slice(-4)}`,
            isExternal: true,
            provider: "EVM",
          })
        }
      })
    }

    // Arweave 账户
    if (isArConnected && arAddress) {
      externalAccounts.push({
        id: `external-arweave-${arAddress}`,
        chain: "arweave",
        address: arAddress,
        alias: "ArConnect 钱包",
        isExternal: true,
        provider: "ArConnect",
      })
    }

    // Solana 账户
    if (isSolConnected && solAddress) {
      externalAccounts.push({
        id: `external-solana-${solAddress}`,
        chain: "solana",
        address: solAddress,
        alias: "Phantom 钱包",
        isExternal: true,
        provider: "Phantom",
      })
    }

    // Sui 账户
    if (isSuiConnected && suiAddress) {
      externalAccounts.push({
        id: `external-sui-${suiAddress}`,
        chain: "sui",
        address: suiAddress,
        alias: "Sui Wallet",
        isExternal: true,
        provider: "Sui Wallet",
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
          console.error(
            `Failed to fetch balance for external ${account.address}:`,
            error,
          )
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
  }, [
    isPaymentConnected,
    paymentAddress,
    isArConnected,
    arAddress,
    isSolConnected,
    solAddress,
    isSuiConnected,
    suiAddress,
  ])

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

    if (allAccounts.length === 0) {
      return (
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
            <Wallet className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400 italic">
          {t("identities.emptyState", { chain })}
            </p>
          </div>
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
          // 判断是否激活：本地账户检查 activeAddress，外部账户检查当前激活的地址
          const isActive = account.isExternal
            ? !walletManager.activeAddress &&
              (account.chain === "ethereum"
                ? account.address.toLowerCase() ===
                  paymentAddress?.toLowerCase()
                : account.chain === "arweave"
                  ? account.address === arAddress
                  : account.chain === "solana"
                    ? account.address === solAddress
                    : account.chain === "sui"
                      ? account.address === suiAddress
                      : true) // 外部账户激活：没有本地账户激活，且地址匹配
            : walletManager.activeAddress === account.address // 本地账户激活：地址匹配

          return (
            <div
              key={account.id || (account as any).id}
              className={`group relative cursor-pointer overflow-hidden rounded-xl border transition-all ${
                isActive
                  ? "border-indigo-300 bg-gradient-to-br from-indigo-50 to-indigo-50/50 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
              onClick={(e) => {
                // 如果点击的是按钮区域，不触发切换
                const target = e.target as HTMLElement
                if (
                  target.closest("button") ||
                  target.closest('[role="button"]')
                ) {
                  return
                }

                // 切换账户
                if (account.isExternal) {
                  if (!isActive) {
                    // 对于 EVM 账户，如果点击的不是当前激活的账户，需要通过账户管理按钮切换
                    // 这里我们会在按钮区域提供切换功能
                    if (
                      account.chain === "ethereum" &&
                      account.address.toLowerCase() !==
                        paymentAddress?.toLowerCase()
                    ) {
                      // 提示用户使用账户管理按钮
                      toast.info("请使用账户管理按钮切换账户", {
                        duration: 2000,
                      })
                    } else {
                      // 对于其他外部账户或当前账户，直接清除本地账户激活状态
                      walletManager.clearActiveWallet()
                      toast.success("已切换到外部账户")
                    }
                  }
                } else {
                  if (!isActive) {
                    walletManager.selectWallet(account.address)
                  }
                }
              }}
            >
              {isActive && (
                <div className="absolute top-0 left-0 h-full w-1 bg-indigo-600" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}
                    >
                      {getChainIcon(account.chain)}
                </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
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
                        {account.isExternal && !isActive && (
                          <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                            外部连接
                          </span>
                        )}
                    </div>
                      <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
                        <span className="truncate">{account.address}</span>
                    <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyAddress(account.address)
                          }}
                          className="shrink-0 p-1 text-slate-400 transition-colors hover:text-indigo-600"
                          title={t("common.copy")}
                        >
                          <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                      <div className="flex items-center gap-2">
                    <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            const isShowing = showBalances[key]
                            if (!isShowing) {
                              // 如果当前隐藏，显示并刷新余额
                              setShowBalances((prev) => ({ ...prev, [key]: true }))
                              // 刷新余额
                              setLoadingBalances((prev) => ({ ...prev, [key]: true }))
                              try {
                                const freshBalance = await getBalance(
                                  account.chain,
                                  account.address,
                                )
                                setBalances((prev) => ({ ...prev, [key]: freshBalance }))
                              } catch (error) {
                                console.error(
                                  `Failed to fetch balance for ${account.address}:`,
                                  error,
                                )
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
                                setLoadingBalances((prev) => ({
                                  ...prev,
                                  [key]: false,
                                }))
                              }
                            } else {
                              // 如果当前显示，隐藏余额
                              setShowBalances((prev) => ({ ...prev, [key]: false }))
                            }
                          }}
                          className="shrink-0 p-1 text-slate-400 transition-colors hover:text-indigo-600"
                          title={
                            showBalances[key]
                              ? "隐藏余额"
                              : "显示余额"
                          }
                        >
                          {showBalances[key] ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                    </button>
                        {loading ? (
                          <span className="text-xs text-slate-400 italic">
                            {t("common.loading")}
                          </span>
                        ) : (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-bold text-indigo-600">
                              {showBalances[key] && balance
                                ? balance.formatted
                                : "****"}
                            </span>
                            <span className="text-xs font-medium text-slate-500 uppercase">
                              {balance?.symbol || account.chain.toUpperCase()}
                            </span>
                          </div>
                        )}
                </div>
              </div>
                  </div>
                  <div
                    className="flex shrink-0 items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {account.isExternal ? (
                      // 外部账户操作按钮
                      <>
                        {account.chain === "ethereum" && isPaymentConnected ? (
                          <ConnectButton.Custom>
                            {({ openAccountModal }) => (
                              <>
                                {!isActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                                    onClick={async (e) => {
                                      e.stopPropagation()

                                      // 尝试通过钱包提供者请求账户切换
                                      // 注意：大多数钱包（如 MetaMask）不支持程序化切换到特定账户
                                      // 但我们可以触发账户选择界面
                                      try {
                                        if (
                                          connector &&
                                          "provider" in connector &&
                                          connector.provider
                                        ) {
                                          const provider = (connector as any)
                                            .provider

                                          // 尝试请求账户访问，这会打开钱包的账户选择界面
                                          try {
                                            await provider.request({
                                              method: "eth_requestAccounts",
                                            })
                                            // 给用户提示，让他们在钱包中选择账户
                                            toast.info(
                                              `请在钱包中选择账户 ${account.address.slice(0, 6)}...${account.address.slice(-4)}`,
                                              { duration: 4000 },
                                            )
                                            // 清除本地账户激活状态，等待外部账户切换
                                            walletManager.clearActiveWallet()
                                            return
                                          } catch (reqError) {
                                            // 如果请求失败，继续打开账户管理模态框
                                            console.debug(
                                              "Account request failed:",
                                              reqError,
                                            )
                                          }
                                        }

                                        // 打开账户管理模态框，让用户手动切换
                                        openAccountModal()
                                        toast.info(
                                          "请在账户管理界面中选择要切换的账户",
                                          {
                                            duration: 3000,
                                          },
                                        )
                                      } catch (error) {
                                        console.error(
                                          "Failed to switch account:",
                                          error,
                                        )
                                        // 如果所有方法都失败，打开账户管理模态框
                                        openAccountModal()
                                        toast.error("切换失败，请手动切换账户")
                                      }
                                    }}
                                    className="h-8 px-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                                    title="切换账户"
                  >
                    <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                                    切换
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openAccountModal()
                                  }}
                                  className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                                  title="管理账户"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </ConnectButton.Custom>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (account.chain === "ethereum") {
                              disconnectEVM()
                              if (
                                !walletManager.activeAddress &&
                                walletManager.vaultId
                              ) {
                                try {
                                  await db.vault.delete(
                                    `use_external_${walletManager.vaultId}`,
                                  )
                                } catch (e) {
                                  console.error(
                                    "Failed to clear external account state:",
                                    e,
                                  )
                                }
                              }
                            } else if (account.chain === "arweave") {
                              disconnectArweave()
                            }
                          }}
                          className="h-8 w-8 p-0 text-slate-400 hover:bg-red-50 hover:text-red-500"
                          title="断开连接"
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      // 本地账户操作按钮
                      <>
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
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
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
                  className="h-12 rounded-xl border-slate-200 pr-12 text-center text-lg focus:ring-indigo-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 transition-colors hover:text-indigo-600"
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
                  <TabsContent value="ethereum" className="px-4 pt-4 pb-4">
                {renderAccountList("ethereum")}
              </TabsContent>
                  <TabsContent value="bitcoin" className="px-4 pt-4 pb-4">
                {renderAccountList("bitcoin")}
              </TabsContent>
                  <TabsContent value="solana" className="px-4 pt-4 pb-4">
                {renderAccountList("solana")}
              </TabsContent>
                  <TabsContent value="sui" className="px-4 pt-4 pb-4">
                    {renderAccountList("sui")}
                  </TabsContent>
                  <TabsContent value="arweave" className="px-4 pt-4 pb-4">
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
                  <TabsList className="mx-4 mt-4 mb-0 h-auto w-auto flex-wrap rounded-lg bg-slate-100 p-1">
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
                    <TabsTrigger
                      value="connect"
                      className="rounded-md px-4 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                    >
                      连接外部
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
                              onChange={(e) =>
                                setNewAccountAlias(e.target.value)
                              }
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
                                onChange={(e) =>
                                  setNewAccountInput(e.target.value)
                                }
                                className="rounded-lg pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowImportKey(!showImportKey)}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-indigo-600"
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
                            className="flex h-24 flex-col gap-2 rounded-lg border-slate-200 transition-all hover:border-indigo-500 hover:bg-indigo-50/50"
                        >
                            <div className="rounded-lg bg-slate-50 p-2 text-slate-600 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-600">
                            {chain.icon}
                          </div>
                            <span className="text-xs font-semibold text-slate-700">
                            {chain.name}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </TabsContent>

                    <TabsContent value="connect" className="mt-0">
            <div className="space-y-4">
                        <p className="mb-4 text-xs text-slate-500">
                          连接外部钱包账户，无需导入私钥即可使用
                        </p>
                        <div className="grid grid-cols-1 gap-3">
                          {/* EVM 钱包连接 */}
                          <ConnectButton.Custom>
                            {({
                              openConnectModal,
                              openAccountModal,
                              account,
                            }) => {
                              // 确保 openAccountModal 可用
                              const handleSwitchAccount = () => {
                                if (typeof openAccountModal === "function") {
                                  openAccountModal()
                                } else {
                                  console.error(
                                    "openAccountModal is not a function",
                                    { openAccountModal, account },
                                  )
                                  toast.error("无法打开账户管理界面")
                                }
                              }

                              return (
                                <div className="space-y-2">
                                  <Button
                                    variant="outline"
                                    onClick={
                                      isPaymentConnected
                                        ? handleSwitchAccount
                                        : openConnectModal
                                    }
                                    className={`flex h-20 w-full items-center justify-start gap-3 rounded-lg transition-all ${
                                      isPaymentConnected
                                        ? "border-green-200 bg-green-50/50 hover:border-green-300 hover:bg-green-50"
                                        : "border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50"
                                    }`}
                                  >
                                    <div
                                      className={`rounded-lg p-2 ${
                                        isPaymentConnected
                                          ? "bg-green-100 text-green-600"
                                          : "bg-slate-50 text-slate-600"
                                      }`}
                                    >
                                      <EthereumIcon className="h-5 w-5" />
                  </div>
                                    <div className="flex flex-1 flex-col items-start">
                                      <span
                                        className={`text-sm font-semibold ${
                                          isPaymentConnected
                                            ? "text-green-700"
                                            : "text-slate-700"
                                        }`}
                                      >
                                        {isPaymentConnected
                                          ? `EVM 钱包 (${allEVMAddresses.length} 个账户)`
                                          : "EVM 钱包"}
                    </span>
                                      <span
                                        className={`text-xs ${
                                          isPaymentConnected
                                            ? "font-mono text-green-600"
                                            : "text-slate-500"
                                        }`}
                                      >
                                        {isPaymentConnected
                                          ? `${paymentAddress?.slice(0, 10)}...${paymentAddress?.slice(-8)}`
                                          : "MetaMask, WalletConnect 等"}
                                      </span>
                </div>
                                    <ExternalLink
                                      className={`h-4 w-4 ${
                                        isPaymentConnected
                                          ? "text-green-500"
                                          : "text-slate-400"
                                      }`}
                                    />
                                  </Button>
                                </div>
                              )
                            }}
                          </ConnectButton.Custom>

                          {/* Arweave 钱包连接 */}
                        <Button
                          variant="outline"
                            onClick={connectArweave}
                            className={`flex h-20 w-full items-center justify-start gap-3 rounded-lg transition-all ${
                              isArConnected
                                ? "border-green-200 bg-green-50/50 hover:border-green-300 hover:bg-green-50"
                                : "border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50"
                            }`}
                          >
                            <div
                              className={`rounded-lg p-2 ${
                                isArConnected
                                  ? "bg-green-100 text-green-600"
                                  : "bg-slate-50 text-slate-600"
                              }`}
                            >
                              <ArweaveIcon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-1 flex-col items-start">
                              <span
                                className={`text-sm font-semibold ${
                                  isArConnected
                                    ? "text-green-700"
                                    : "text-slate-700"
                                }`}
                              >
                                {isArConnected
                                  ? "ArConnect 钱包 (已连接)"
                                  : "ArConnect 钱包"}
                            </span>
                              <span
                                className={`text-xs ${
                                  isArConnected
                                    ? "font-mono text-green-600"
                                    : "text-slate-500"
                                }`}
                              >
                                {isArConnected
                                  ? `${arAddress?.slice(0, 10)}...${arAddress?.slice(-8)}`
                                  : "Arweave 生态钱包"}
                              </span>
                            </div>
                            <ExternalLink
                              className={`h-4 w-4 ${
                                isArConnected
                                  ? "text-green-500"
                                  : "text-slate-400"
                              }`}
                            />
                            </Button>

                          {/* Solana 钱包连接 */}
                            <Button
                            variant="outline"
                            onClick={
                              isSolConnected ? disconnectSolana : connectSolana
                            }
                            className={`flex h-20 w-full items-center justify-start gap-3 rounded-lg transition-all ${
                              isSolConnected
                                ? "border-green-200 bg-green-50/50 hover:border-green-300 hover:bg-green-50"
                                : "border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50"
                            }`}
                          >
                            <div
                              className={`rounded-lg p-2 ${
                                isSolConnected
                                  ? "bg-green-100 text-green-600"
                                  : "bg-slate-50 text-slate-600"
                              }`}
                            >
                              <SolanaIcon className="h-5 w-5" />
                          </div>
                            <div className="flex flex-1 flex-col items-start">
                              <span
                                className={`text-sm font-semibold ${
                                  isSolConnected
                                    ? "text-green-700"
                                    : "text-slate-700"
                                }`}
                              >
                                {isSolConnected
                                  ? "Phantom 钱包 (已连接)"
                                  : "Phantom 钱包"}
                    </span>
                              <span
                                className={`text-xs ${
                                  isSolConnected
                                    ? "font-mono text-green-600"
                                    : "text-slate-500"
                                }`}
                              >
                                {isSolConnected
                                  ? `${solAddress?.slice(0, 10)}...${solAddress?.slice(-8)}`
                                  : "Solana 生态钱包"}
                    </span>
                </div>
                            <ExternalLink
                              className={`h-4 w-4 ${
                                isSolConnected
                                  ? "text-green-500"
                                  : "text-slate-400"
                              }`}
                            />
                          </Button>

                          {/* Sui 钱包连接 */}
                    <Button
                      variant="outline"
                            onClick={
                              isSuiConnected ? disconnectSui : connectSui
                            }
                            className={`flex h-20 w-full items-center justify-start gap-3 rounded-lg transition-all ${
                              isSuiConnected
                                ? "border-green-200 bg-green-50/50 hover:border-green-300 hover:bg-green-50"
                                : "border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50"
                            }`}
                          >
                            <div
                              className={`rounded-lg p-2 ${
                                isSuiConnected
                                  ? "bg-green-100 text-green-600"
                                  : "bg-slate-50 text-slate-600"
                              }`}
                            >
                              <SuiIcon className="h-5 w-5" />
                          </div>
                            <div className="flex flex-1 flex-col items-start">
                              <span
                                className={`text-sm font-semibold ${
                                  isSuiConnected
                                    ? "text-green-700"
                                    : "text-slate-700"
                                }`}
                              >
                                {isSuiConnected
                                  ? "Sui Wallet (已连接)"
                                  : "Sui Wallet"}
                          </span>
                              <span
                                className={`text-xs ${
                                  isSuiConnected
                                    ? "font-mono text-green-600"
                                    : "text-slate-500"
                                }`}
                              >
                                {isSuiConnected
                                  ? `${suiAddress?.slice(0, 10)}...${suiAddress?.slice(-8)}`
                                  : "Sui 生态钱包"}
                              </span>
                            </div>
                            <ExternalLink
                              className={`h-4 w-4 ${
                                isSuiConnected
                                  ? "text-green-500"
                                  : "text-slate-400"
                              }`}
                            />
                        </Button>
                      </div>
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
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-indigo-600"
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
