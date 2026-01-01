import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "@/i18n/config"
import { useWalletManager } from "@/hooks/use-wallet-manager"
import { toast } from "sonner"
import { useAccount, useDisconnect } from "wagmi"
import { getBalance, type BalanceResult } from "@/lib/balance"
import { db } from "@/lib/db"
import { LogOut, ShieldCheck, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useExternalWallets } from "@/hooks/use-external-wallets"
import { UnlockForm } from "@/components/account/UnlockForm"
import { AccountList } from "@/components/account/AccountList"
import { AddAccountSection } from "@/components/account/AddAccountSection"
import { SensitiveInfoDialog } from "@/components/account/SensitiveInfoDialog"

export default function AccountPage() {
  const { t } = useTranslation()
  const walletManager = useWalletManager()
  const { connector } = useAccount()
  const { disconnect: disconnectEVM } = useDisconnect()

  // 使用外部钱包 hook
  const externalWallets = useExternalWallets()

  // 敏感信息对话框
  const [showSensitiveDialog, setShowSensitiveDialog] = useState(false)
  const [sensitiveAccount, setSensitiveAccount] = useState<any>(null)
  const [viewType, setViewType] = useState<"key" | "mnemonic">("key")

  // 余额状态
  const [balances, setBalances] = useState<
    Record<string, BalanceResult | null>
  >({})
  const [loadingBalances, setLoadingBalances] = useState<
    Record<string, boolean>
  >({})
  const [showBalances, setShowBalances] = useState<Record<string, boolean>>({})

  // 获取所有账户的余额
  useEffect(() => {
    if (!walletManager.isUnlocked || walletManager.wallets.length === 0) {
      return
    }

    const fetchBalances = async () => {
      const promises = walletManager.wallets.map(async (wallet) => {
        const key = `${wallet.chain}-${wallet.address}`

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
  }, [walletManager.isUnlocked, walletManager.wallets, balances])

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
    externalWallets.isPaymentConnected,
    externalWallets.paymentAddress,
    externalWallets.isArConnected,
    externalWallets.arAddress,
    externalWallets.isSolConnected,
    externalWallets.solAddress,
    externalWallets.isSuiConnected,
    externalWallets.suiAddress,
  ])

  // 获取外部连接的账户信息
  const getExternalAccounts = useCallback(() => {
    const externalAccounts: Array<{
      id: string
      chain: string
      address: string
      alias: string
      isExternal: true
      provider?: string
    }> = []

    // EVM 账户
    if (
      externalWallets.isPaymentConnected &&
      externalWallets.allEVMAddresses &&
      Array.isArray(externalWallets.allEVMAddresses) &&
      externalWallets.allEVMAddresses.length > 0
    ) {
      externalWallets.allEVMAddresses.forEach((address) => {
        if (address && typeof address === "string") {
          const isActive =
            address.toLowerCase() ===
            externalWallets.paymentAddress?.toLowerCase()
          externalAccounts.push({
            id: `external-evm-${address}`,
            chain: "ethereum",
            address: address,
            alias: isActive
              ? t("identities.evmWalletCurrent")
              : t("identities.evmWalletAddress", {
                  address: `${address.slice(0, 6)}...${address.slice(-4)}`,
                }),
            isExternal: true,
            provider: "EVM",
          })
        }
      })
    }

    // Arweave 账户
    if (externalWallets.isArConnected && externalWallets.arAddress) {
      externalAccounts.push({
        id: `external-arweave-${externalWallets.arAddress}`,
        chain: "arweave",
        address: externalWallets.arAddress,
        alias: t("identities.arconnectWallet"),
        isExternal: true,
        provider: "ArConnect",
      })
    }

    // Solana 账户
    if (externalWallets.isSolConnected && externalWallets.solAddress) {
      externalAccounts.push({
        id: `external-solana-${externalWallets.solAddress}`,
        chain: "solana",
        address: externalWallets.solAddress,
        alias: t("identities.phantomWallet"),
        isExternal: true,
        provider: "Phantom",
      })
    }

    // Sui 账户
    if (externalWallets.isSuiConnected && externalWallets.suiAddress) {
      externalAccounts.push({
        id: `external-sui-${externalWallets.suiAddress}`,
        chain: "sui",
        address: externalWallets.suiAddress,
        alias: t("identities.suiWallet"),
        isExternal: true,
        provider: "Sui Wallet",
      })
    }

    return externalAccounts
  }, [externalWallets, t])

  // 处理函数
  const handleUnlock = async (password: string) => {
    return await walletManager.unlock(password)
  }

  const handleAddAccount = async (input: string, alias: string) => {
    if (!input || !alias) {
      toast.error(t("identities.keyPlaceholder"))
      return
    }
    await walletManager.addWallet(input, alias)
  }

  const handleCreateAccount = async (chain: string) => {
    const alias = prompt(
      t("identities.aliasPrompt"),
      `${chain.toUpperCase()}-Account`,
    )
    if (!alias) return
    await walletManager.createWallet(chain as any, alias)
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
    setViewType(type)
    setShowSensitiveDialog(true)
  }

  const verifyAndShow = async (password: string) => {
    try {
      const info = await walletManager.getDecryptedInfo(
        sensitiveAccount,
        password,
      )
      return info
    } catch (e) {
      toast.error(t("unlock.incorrect"))
      return null
    }
  }

  const refreshBalance = async (
    chain: string,
    address: string,
    isExternal = false,
  ) => {
    const key = isExternal
      ? `external-${chain}-${address}`
      : `${chain}-${address}`
    setLoadingBalances((prev) => ({ ...prev, [key]: true }))
    try {
      const balance = await getBalance(chain, address)
      setBalances((prev) => ({ ...prev, [key]: balance }))
    } catch (error) {
      console.error(`Failed to fetch balance for ${address}:`, error)
      setBalances((prev) => ({
        ...prev,
        [key]: {
          balance: "0",
          formatted: "0",
          symbol: chain.toUpperCase(),
          error: "Failed to fetch",
        },
      }))
    } finally {
      setLoadingBalances((prev) => ({ ...prev, [key]: false }))
    }
  }

  // 渲染账户列表
  const renderAccountList = (chain: string) => {
    const localAccounts = walletManager.wallets.filter((w) => w.chain === chain)
    const externalAccounts = getExternalAccounts().filter(
      (acc) => acc.chain === chain,
    )

    const allAccounts = [
      ...localAccounts.map((w) => ({
        ...w,
        id: w.id?.toString(),
        isExternal: false,
      })),
      ...externalAccounts.map((acc) => ({
        ...acc,
        alias:
          acc.chain === "ethereum"
            ? t("identities.evmWallet")
            : acc.chain === "arweave"
              ? t("identities.arconnectWallet")
              : acc.chain === "solana"
                ? t("identities.phantomWallet")
                : acc.chain === "sui"
                  ? t("identities.suiWallet")
                  : t("identities.externalAccount"),
      })),
    ]

    const isActive = (account: any) => {
      if (account.isExternal) {
        return (
          !walletManager.activeAddress &&
          (account.chain === "ethereum"
            ? account.address.toLowerCase() ===
              externalWallets.paymentAddress?.toLowerCase()
            : account.chain === "arweave"
              ? account.address === externalWallets.arAddress
              : account.chain === "solana"
                ? account.address === externalWallets.solAddress
                : account.chain === "sui"
                  ? account.address === externalWallets.suiAddress
                  : true)
        )
      }
      return walletManager.activeAddress === account.address
    }

    const handleSelect = (account: any) => {
      if (account.isExternal) {
        if (!isActive(account)) {
          if (
            account.chain === "ethereum" &&
            account.address.toLowerCase() !==
              externalWallets.paymentAddress?.toLowerCase()
          ) {
            toast.info(t("identities.switchAccountHint"), {
              duration: 2000,
            })
          } else {
            walletManager.clearActiveWallet()
            toast.success(t("identities.switchedToExternal"))
          }
        }
      } else {
        if (!isActive(account)) {
          walletManager.selectWallet(account.address)
        }
      }
    }

    const handleDisconnect = async (account: any) => {
      if (account.chain === "ethereum") {
        disconnectEVM()
        if (!walletManager.activeAddress && walletManager.vaultId) {
          try {
            await db.vault.delete(`use_external_${walletManager.vaultId}`)
          } catch (e) {
            console.error("Failed to clear external account state:", e)
          }
        }
      } else if (account.chain === "arweave") {
        externalWallets.disconnectArweave()
      } else if (account.chain === "solana") {
        externalWallets.disconnectSolana()
      } else if (account.chain === "sui") {
        externalWallets.disconnectSui()
      }
    }

    return (
      <AccountList
        chain={chain}
        accounts={allAccounts}
        balances={balances}
        loadingBalances={loadingBalances}
        showBalances={showBalances}
        isActive={isActive}
        onSelect={handleSelect}
        onCopyAddress={copyAddress}
        onShowSensitive={
          walletManager.isUnlocked ? handleShowSensitive : undefined
        }
        onDisconnect={handleDisconnect}
        onToggleBalance={(key, show) => {
          setShowBalances((prev) => ({ ...prev, [key]: show }))
        }}
        onRefreshBalance={(chain, address, isExternal) =>
          refreshBalance(chain, address, isExternal)
        }
        isPaymentConnected={externalWallets.isPaymentConnected}
        connector={connector}
        paymentAddress={externalWallets.paymentAddress}
      />
    )
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
        <UnlockForm onUnlock={handleUnlock} />
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

            <AddAccountSection
              onAddAccount={handleAddAccount}
              onCreateAccount={handleCreateAccount}
              isPaymentConnected={externalWallets.isPaymentConnected}
              paymentAddress={externalWallets.paymentAddress}
              allEVMAddresses={externalWallets.allEVMAddresses}
              isArConnected={externalWallets.isArConnected}
              arAddress={externalWallets.arAddress}
              connectArweave={externalWallets.connectArweave}
              isSolConnected={externalWallets.isSolConnected}
              solAddress={externalWallets.solAddress}
              connectSolana={externalWallets.connectSolana}
              disconnectSolana={externalWallets.disconnectSolana}
              isSuiConnected={externalWallets.isSuiConnected}
              suiAddress={externalWallets.suiAddress}
              connectSui={externalWallets.connectSui}
              disconnectSui={externalWallets.disconnectSui}
            />
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

      <SensitiveInfoDialog
        open={showSensitiveDialog}
        onOpenChange={setShowSensitiveDialog}
        account={sensitiveAccount}
        type={viewType}
        onVerify={verifyAndShow}
      />
    </div>
  )
}
