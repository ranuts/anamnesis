import { Link, useLocation } from "react-router-dom"
import {
  HardDrive,
  LayoutDashboard,
  Upload,
  UserCircle,
  CreditCard,
  User,
  Settings,
} from "lucide-react"
import { useTranslation } from "@/i18n/config"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useWalletManager } from "@/hooks/use-wallet-manager"
import { useExternalWallets } from "@/hooks/use-external-wallets"
import {
  ArweaveIcon,
  EthereumIcon,
  SolanaIcon,
  BitcoinIcon,
  SuiIcon,
} from "@/components/icons"

export function Navbar() {
  const { t } = useTranslation()
  const location = useLocation()
  const walletManager = useWalletManager()
  const externalWallets = useExternalWallets()

  const navItems = [
    { path: "/", label: t("common.dashboard"), icon: LayoutDashboard },
    { path: "/upload", label: t("common.upload"), icon: Upload },
    { path: "/account", label: t("common.account"), icon: UserCircle },
  ]

  const activeAccount = walletManager.wallets.find(
    (w) => w.address === walletManager.activeAddress,
  )

  const shortenedAddress = (addr: string) =>
    `${addr.slice(0, 5)}...${addr.slice(-4)}`

  const getChainIcon = (chain?: string) => {
    switch (chain?.toLowerCase()) {
      case "ethereum":
        return <EthereumIcon className="h-3.5 w-3.5" />
      case "solana":
        return <SolanaIcon className="h-3.5 w-3.5" />
      case "bitcoin":
        return <BitcoinIcon className="h-3.5 w-3.5" />
      case "sui":
        return <SuiIcon className="h-3.5 w-3.5" />
      case "arweave":
        return <ArweaveIcon className="h-3.5 w-3.5" />
      default:
        return <User className="h-3.5 w-3.5" />
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <HardDrive className="h-7 w-7 text-indigo-600 sm:h-8 sm:w-8" />
              <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                {t("common.appName")}
              </h1>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems
                .filter((item) => item.path !== "/account")
                .map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="flex items-center gap-2">
              <ConnectButton.Custom>
                {({ account, chain, mounted }) => {
                  const ready = mounted
                  const connected = ready && !!account && !!chain
                  const hasLocalAccount =
                    walletManager.isUnlocked && !!walletManager.activeAddress

                  const isSolActive =
                    externalWallets.isSolConnected &&
                    !!externalWallets.solAddress
                  const isSuiActive =
                    externalWallets.isSuiConnected &&
                    !!externalWallets.suiAddress
                  const isArActive =
                    externalWallets.isArConnected && !!externalWallets.arAddress

                  const anyConnected =
                    hasLocalAccount ||
                    connected ||
                    isSolActive ||
                    isSuiActive ||
                    isArActive

                  return (
                    <Link
                      to="/account"
                      className={`flex h-9 items-center gap-2 rounded-full border px-3 shadow-sm transition-all active:scale-95 sm:h-8 ${
                        anyConnected
                          ? "border-slate-200 bg-white hover:bg-slate-50"
                          : "border-dashed border-slate-300 bg-slate-50/50 text-slate-400 hover:border-indigo-300 hover:text-indigo-500"
                      }`}
                    >
                      {!walletManager.isUnlocked ? (
                        <>
                          <UserCircle className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                          <span className="hidden text-xs font-bold sm:inline">
                            {t("common.account")}
                          </span>
                        </>
                      ) : hasLocalAccount && activeAccount ? (
                        <>
                          <div className="flex h-3.5 w-3.5 items-center justify-center">
                            {getChainIcon(activeAccount.chain)}
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            {shortenedAddress(walletManager.activeAddress!)}
                          </span>
                        </>
                      ) : connected && account ? (
                        <>
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          {chain?.hasIcon && chain.iconUrl ? (
                            <img
                              alt={chain.name ?? "Chain icon"}
                              src={chain.iconUrl}
                              style={{ width: 14, height: 14 }}
                            />
                          ) : (
                            <EthereumIcon className="h-3.5 w-3.5" />
                          )}
                          <span className="text-xs font-bold text-slate-700">
                            {account.displayName}
                          </span>
                        </>
                      ) : isSolActive ? (
                        <>
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          <SolanaIcon className="h-3.5 w-3.5" />
                          <span className="text-xs font-bold text-slate-700">
                            {shortenedAddress(externalWallets.solAddress!)}
                          </span>
                        </>
                      ) : isSuiActive ? (
                        <>
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          <SuiIcon className="h-3.5 w-3.5" />
                          <span className="text-xs font-bold text-slate-700">
                            {shortenedAddress(externalWallets.suiAddress!)}
                          </span>
                        </>
                      ) : isArActive ? (
                        <>
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          <ArweaveIcon className="h-3.5 w-3.5" />
                          <span className="text-xs font-bold text-slate-700">
                            {shortenedAddress(externalWallets.arAddress!)}
                          </span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                          <span className="hidden text-xs font-bold sm:inline">
                            {t("common.account")}
                          </span>
                        </>
                      )}
                    </Link>
                  )
                }}
              </ConnectButton.Custom>
            </div>
            <Link
              to="/account"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all active:scale-95 sm:hidden"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="pb-safe fixed right-0 bottom-0 left-0 z-40 border-t bg-white/95 backdrop-blur-lg md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            const isAccount = item.path === "/account"

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-1 flex-col items-center justify-center gap-1 transition-all ${
                  isActive ? "text-indigo-600" : "text-slate-500"
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`h-5 w-5 ${isActive ? "scale-110" : "scale-100"}`}
                  />
                  {isAccount && walletManager.isUnlocked && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600"></span>
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-wide uppercase">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
