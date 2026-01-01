import { Link, useLocation } from "react-router-dom"
import {
  HardDrive,
  LayoutDashboard,
  Upload,
  UserCircle,
  ShieldCheck,
  CreditCard,
  User,
  Bitcoin,
} from "lucide-react"
import { useTranslation } from "@/i18n/config"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useWalletManager } from "@/hooks/use-wallet-manager"
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

  const navItems = [
    { path: "/", label: t("common.dashboard"), icon: LayoutDashboard },
    { path: "/upload", label: t("common.upload"), icon: Upload },
    {
      path: "/account",
      label: t("common.account"),
      icon: walletManager.isUnlocked ? ShieldCheck : UserCircle,
    },
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
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <HardDrive className="h-8 w-8 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight">
              {t("common.appName")}
            </h1>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              const isAccount = item.path === "/account"

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
                  <div className="relative">
                    <Icon className="h-4 w-4" />
                    {isAccount && walletManager.isUnlocked && (
                      <span className="absolute -right-1 -top-1 flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600"></span>
                      </span>
                    )}
                  </div>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <div className="mx-1 h-8 w-px bg-slate-200" />

          {/* 统一钱包状态展示 */}
          <div className="flex items-center gap-2">
            {/* 当前使用账户 (Identity) - 如果存在则优先展示 */}
            {walletManager.isUnlocked && walletManager.activeAddress && (
              <Link
                to="/account"
                className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-3 py-1.5 transition-all hover:bg-indigo-50 active:scale-95 shadow-xs"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                  {getChainIcon(activeAccount?.chain)}
                </div>
                <span className="text-xs font-bold text-indigo-700">
                  {shortenedAddress(walletManager.activeAddress)}
                </span>
              </Link>
            )}

            {/* 支付状态 (ConnectButton) */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted
                const connected = ready && account && chain
                const hasActivePersona =
                  walletManager.isUnlocked && walletManager.activeAddress

                return (
                  <div
                    {...(!ready && {
                      "aria-hidden": true,
                      style: {
                        opacity: 0,
                        pointerEvents: "none",
                        userSelect: "none",
                      },
                    })}
                  >
                    {!connected ? (
                      <button
                        onClick={openConnectModal}
                        className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                          hasActivePersona
                            ? "border border-dashed border-slate-300 text-slate-400 hover:border-indigo-300 hover:text-indigo-500"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                        }`}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        {!hasActivePersona && (
                          <span className="hidden sm:inline">
                            {t("upload.irysConnectWallet")}
                          </span>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={openAccountModal}
                        className={`flex h-8 items-center gap-2 rounded-full border px-2.5 transition-all active:scale-95 shadow-sm ${
                          hasActivePersona
                            ? "border-slate-100 bg-slate-50 text-slate-400"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            hasActivePersona ? "bg-slate-300" : "bg-green-500"
                          }`}
                        />
                        {!hasActivePersona && (
                          <>
                            {chain.hasIcon && chain.iconUrl && (
                              <img
                                alt={chain.name ?? "Chain icon"}
                                src={chain.iconUrl}
                                style={{ width: 14, height: 14 }}
                              />
                            )}
                            <span className="text-xs font-bold">
                              {account.displayName}
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </header>
  )
}
