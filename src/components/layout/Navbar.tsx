import { Link, useLocation } from "react-router-dom"
import { HardDrive, LayoutDashboard, Upload, UserCircle } from "lucide-react"
import { useTranslation } from "@/i18n/config"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useWalletManager } from "@/hooks/use-wallet-manager"
import { ShieldCheck, Lock } from "lucide-react"

export function Navbar() {
  const { t } = useTranslation()
  const location = useLocation()
  const walletManager = useWalletManager()

  const navItems = [
    { path: "/", label: t("common.dashboard"), icon: LayoutDashboard },
    { path: "/upload", label: t("common.upload"), icon: Upload },
    { path: "/account", label: t("common.account"), icon: UserCircle },
  ]

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
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
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

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <div className="h-8 w-px bg-slate-200" />
          <ConnectButton />
          <div className="h-8 w-px bg-slate-200" />
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${
              walletManager.isUnlocked
                ? "border-green-200 bg-green-50 text-green-600"
                : "border-amber-200 bg-amber-50 text-amber-600"
            }`}
          >
            {walletManager.isUnlocked ? (
              <ShieldCheck className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {walletManager.isUnlocked
                ? t("common.activeIdentity")
                : t("common.identityLocked")}
            </span>
          </div>

          {walletManager.isUnlocked && walletManager.activeAddress && (
            <div className="hidden flex-col items-end border-l border-slate-200 pl-4 lg:flex">
              <span className="mb-1 text-[10px] leading-none font-bold tracking-tighter text-slate-400 uppercase">
                Active Identity
              </span>
              <span className="max-w-[100px] truncate text-xs font-bold text-slate-700">
                {walletManager.wallets.find(
                  (w) => w.address === walletManager.activeAddress,
                )?.alias || "Unnamed"}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
