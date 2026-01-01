import { Link, useLocation } from "react-router-dom"
import {
  HardDrive,
  LayoutDashboard,
  Upload,
  UserCircle,
  CreditCard,
  User,
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
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
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

          {/* 统一账户状态展示 - 只显示当前激活的账户（本地或外部，互斥），点击统一跳转到账户页面 */}
          <div className="flex items-center gap-2">
            <ConnectButton.Custom>
              {({ account, chain, mounted }) => {
                const ready = mounted
                const connected = ready && !!account && !!chain
                const hasLocalAccount =
                  walletManager.isUnlocked && !!walletManager.activeAddress

                // 外部非 EVM 钱包状态
                const isSolActive =
                  externalWallets.isSolConnected && !!externalWallets.solAddress
                const isSuiActive =
                  externalWallets.isSuiConnected && !!externalWallets.suiAddress
                const isArActive =
                  externalWallets.isArConnected && !!externalWallets.arAddress

                const anyConnected =
                  hasLocalAccount ||
                  connected ||
                  isSolActive ||
                  isSuiActive ||
                  isArActive

                // 统一包装在 Link 中，点击总是跳转到 /account
                return (
                  <Link
                    to="/account"
                    className={`flex h-8 items-center gap-2 rounded-full border px-3 shadow-sm transition-all active:scale-95 ${
                      anyConnected
                        ? "border-slate-200 bg-white hover:bg-slate-50"
                        : "border-dashed border-slate-300 bg-slate-50/50 text-slate-400 hover:border-indigo-300 hover:text-indigo-500"
                    }`}
                  >
                    {!walletManager.isUnlocked ? (
                      // 未解锁状态
                      <>
                        <UserCircle className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold">
                          {t("common.account")}
                        </span>
                      </>
                    ) : hasLocalAccount && activeAccount ? (
                      // 1. 本地账户激活状态 (优先级最高)
                      <>
                        <div className="flex h-3.5 w-3.5 items-center justify-center">
                          {getChainIcon(activeAccount.chain)}
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {shortenedAddress(walletManager.activeAddress!)}
                        </span>
                      </>
                    ) : connected && account ? (
                      // 2. EVM 外部账户连接状态
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
                      // 3. Solana 外部账户
                      <>
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <SolanaIcon className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold text-slate-700">
                          {shortenedAddress(externalWallets.solAddress!)}
                        </span>
                      </>
                    ) : isSuiActive ? (
                      // 4. Sui 外部账户
                      <>
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <SuiIcon className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold text-slate-700">
                          {shortenedAddress(externalWallets.suiAddress!)}
                        </span>
                      </>
                    ) : isArActive ? (
                      // 5. Arweave 外部账户
                      <>
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <ArweaveIcon className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold text-slate-700">
                          {shortenedAddress(externalWallets.arAddress!)}
                        </span>
                      </>
                    ) : (
                      // 已解锁但未选择/连接状态
                      <>
                        <CreditCard className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold">
                          {t("common.account")}
                        </span>
                      </>
                    )}
                  </Link>
                )
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </header>
  )
}
