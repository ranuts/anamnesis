import { Wallet } from "lucide-react"
import { useTranslation } from "@/i18n/config"
import { AccountCard } from "./AccountCard"
import { getBalance, type BalanceResult } from "@/lib/balance"
import { toast } from "sonner"

interface Account {
  id?: string
  chain: string
  address: string
  alias: string
  isExternal: boolean
}

interface AccountListProps {
  chain: string
  accounts: Account[]
  balances: Record<string, BalanceResult | null>
  loadingBalances: Record<string, boolean>
  showBalances: Record<string, boolean>
  isActive: (account: Account) => boolean
  onSelect: (account: Account) => void
  onCopyAddress: (address: string) => void
  onShowSensitive?: (account: Account, type: "key" | "mnemonic") => void
  onDisconnect?: (account: Account) => void
  onToggleBalance: (key: string, show: boolean) => void
  onRefreshBalance: (
    chain: string,
    address: string,
    isExternal?: boolean,
  ) => Promise<void>
  // External account props
  isPaymentConnected?: boolean
  connector?: any
  paymentAddress?: string
}

export function AccountList({
  chain,
  accounts,
  balances,
  loadingBalances,
  showBalances,
  isActive,
  onSelect,
  onCopyAddress,
  onShowSensitive,
  onDisconnect,
  onToggleBalance,
  onRefreshBalance,
  isPaymentConnected,
  connector,
  paymentAddress,
}: AccountListProps) {
  const { t } = useTranslation()

  if (accounts.length === 0) {
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
      {accounts.map((account) => {
        const key = account.isExternal
          ? `external-${account.chain}-${account.address}`
          : `${account.chain}-${account.address}`
        const balance = balances[key]
        const loading = loadingBalances[key]
        const active = isActive(account)

        return (
          <AccountCard
            key={account.id || key}
            account={account}
            isActive={active}
            balance={balance}
            loading={loading}
            showBalance={showBalances[key] || false}
            onToggleBalance={(show) => onToggleBalance(key, show)}
            onRefreshBalance={async () => {
              await onRefreshBalance(
                account.chain,
                account.address,
                account.isExternal,
              )
            }}
            onSelect={() => onSelect(account)}
            onCopyAddress={onCopyAddress}
            onShowSensitive={onShowSensitive}
            onDisconnect={
              onDisconnect ? () => onDisconnect(account) : undefined
            }
            isPaymentConnected={isPaymentConnected}
            connector={connector}
            paymentAddress={paymentAddress}
          />
        )
      })}
    </div>
  )
}
