import { useState } from "react"
import { useTranslation } from "@/i18n/config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Eye, EyeOff } from "lucide-react"
import {
  EthereumIcon,
  BitcoinIcon,
  SolanaIcon,
  SuiIcon,
  ArweaveIcon,
} from "@/components/icons"

import { ExternalWalletConnector } from "./ExternalWalletConnector"

interface AddAccountSectionProps {
  onAddAccount: (input: string, alias: string) => Promise<void>
  onCreateAccount: (chain: string) => Promise<void>
  // External wallet props
  isPaymentConnected: boolean
  paymentAddress?: string
  allEVMAddresses: string[]
  isArConnected: boolean
  arAddress: string | null
  connectArweave: () => void
  isSolConnected: boolean
  solAddress: string | null
  connectSolana: () => void
  disconnectSolana: () => void
  isSuiConnected: boolean
  suiAddress: string | null
  connectSui: () => void
  disconnectSui: () => void
}

export function AddAccountSection({
  onAddAccount,
  onCreateAccount,
  isPaymentConnected,
  paymentAddress,
  allEVMAddresses,
  isArConnected,
  arAddress,
  connectArweave,
  isSolConnected,
  solAddress,
  connectSolana,
  disconnectSolana,
  isSuiConnected,
  suiAddress,
  connectSui,
  disconnectSui,
}: AddAccountSectionProps) {
  const { t } = useTranslation()
  const [newAccountInput, setNewAccountInput] = useState("")
  const [newAccountAlias, setNewAccountAlias] = useState("")
  const [showImportKey, setShowImportKey] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAccountInput || !newAccountAlias) {
      return
    }
    await onAddAccount(newAccountInput, newAccountAlias)
    setNewAccountInput("")
    setNewAccountAlias("")
  }

  const chains = [
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
    { id: "solana", name: "Solana", icon: <SolanaIcon className="h-5 w-5" /> },
    { id: "sui", name: "Sui", icon: <SuiIcon className="h-5 w-5" /> },
    {
      id: "arweave",
      name: "Arweave",
      icon: <ArweaveIcon className="h-5 w-5" />,
    },
  ]

  return (
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
            <TabsTrigger
              value="connect"
              className="rounded-md px-4 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
            >
              {t("identities.connectExternal")}
            </TabsTrigger>
          </TabsList>

          <div className="p-6 pt-4">
            <TabsContent value="import" className="mt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
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
                {chains.map((chain) => (
                  <Button
                    key={chain.id}
                    variant="outline"
                    onClick={() => onCreateAccount(chain.id)}
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
              <ExternalWalletConnector
                isPaymentConnected={isPaymentConnected}
                paymentAddress={paymentAddress}
                allEVMAddresses={allEVMAddresses}
                isArConnected={isArConnected}
                arAddress={arAddress}
                connectArweave={connectArweave}
                isSolConnected={isSolConnected}
                solAddress={solAddress}
                connectSolana={connectSolana}
                disconnectSolana={disconnectSolana}
                isSuiConnected={isSuiConnected}
                suiAddress={suiAddress}
                connectSui={connectSui}
                disconnectSui={disconnectSui}
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
