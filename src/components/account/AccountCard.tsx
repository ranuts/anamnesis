import { Copy, Key, FileText, Unlink, ExternalLink, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { BalanceDisplay } from "./BalanceDisplay"
import { type BalanceResult } from "@/lib/balance"
import { useTranslation } from "@/i18n/config"
import { toast } from "sonner"
import {
  ArweaveIcon,
  EthereumIcon,
  SolanaIcon,
  SuiIcon,
  BitcoinIcon,
} from "@/components/icons"

interface AccountCardProps {
  account: {
    id?: string
    chain: string
    address: string
    alias: string
    isExternal: boolean
  }
  isActive: boolean
  balance: BalanceResult | null
  loading: boolean
  showBalance: boolean
  onToggleBalance: (show: boolean) => void
  onRefreshBalance: () => Promise<void>
  onSelect: () => void
  onCopyAddress: (address: string) => void
  onShowSensitive?: (account: any, type: "key" | "mnemonic") => void
  onDisconnect?: () => void
  // External account props
  isPaymentConnected?: boolean
  connector?: any
  paymentAddress?: string
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
      return null
  }
}

export function AccountCard({
  account,
  isActive,
  balance,
  loading,
  showBalance,
  onToggleBalance,
  onRefreshBalance,
  onSelect,
  onCopyAddress,
  onShowSensitive,
  onDisconnect,
  isPaymentConnected,
  connector,
  paymentAddress,
}: AccountCardProps) {
  const { t } = useTranslation()

  return (
    <div
      className={`group relative cursor-pointer overflow-hidden rounded-xl border transition-all ${
        isActive
          ? "border-indigo-300 bg-gradient-to-br from-indigo-50 to-indigo-50/50 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (
          target.closest("button") ||
          target.closest('[role="button"]')
        ) {
          return
        }
        onSelect()
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
                  {account.alias}
                </h3>
                {isActive && (
                  <span className="shrink-0 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                    {t("identities.currentAccount")}
                  </span>
                )}
                {account.isExternal && !isActive && (
                  <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                    {t("identities.externalConnected")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
                <span className="truncate">{account.address}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCopyAddress(account.address)
                  }}
                  className="shrink-0 p-1 text-slate-400 transition-colors hover:text-indigo-600"
                  title={t("common.copy")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <BalanceDisplay
                chain={account.chain}
                address={account.address}
                balance={balance}
                loading={loading}
                showBalance={showBalance}
                onToggle={onToggleBalance}
                onRefresh={onRefreshBalance}
              />
            </div>
          </div>
          <div
            className="flex shrink-0 items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {account.isExternal ? (
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
                              try {
                                if (
                                  connector &&
                                  "provider" in connector &&
                                  connector.provider
                                ) {
                                  const provider = (connector as any).provider
                                  try {
                                    await provider.request({
                                      method: "eth_requestAccounts",
                                    })
                                    toast.info(
                                      t("identities.switchAccountInWallet", {
                                        address: `${account.address.slice(0, 6)}...${account.address.slice(-4)}`,
                                      }),
                                      { duration: 4000 },
                                    )
                                    return
                                  } catch (reqError) {
                                    console.debug(
                                      "Account request failed:",
                                      reqError,
                                    )
                                  }
                                }
                                openAccountModal()
                                toast.info(
                                  t("identities.switchAccountInModal"),
                                  {
                                    duration: 3000,
                                  },
                                )
                              } catch (error) {
                                console.error("Failed to switch account:", error)
                                openAccountModal()
                                toast.error(t("identities.switchAccountFailed"))
                              }
                            }}
                            className="h-8 px-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                            title={t("identities.switchAccount")}
                          >
                            <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                            {t("identities.switchAccount")}
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
                          title={t("identities.manageAccount")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </ConnectButton.Custom>
                ) : null}
                {onDisconnect && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDisconnect}
                    className="h-8 w-8 p-0 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    title={t("identities.disconnect")}
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                )}
              </>
            ) : (
              <>
                {onShowSensitive && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onShowSensitive(account, "key")}
                      className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                      title={t("identities.viewSensitive")}
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    {account.chain !== "arweave" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onShowSensitive(account, "mnemonic")}
                        className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                        title={t("identities.mnemonic")}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

