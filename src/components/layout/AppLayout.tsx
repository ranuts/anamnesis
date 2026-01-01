import { type ReactNode } from "react"
import { Navbar } from "./Navbar"
import { useTranslation } from "@/i18n/config"
import { Toaster } from "sonner"

export function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans text-slate-900 md:pb-0">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-6 sm:py-8 lg:px-8">
        {children}
      </main>
      <footer className="mt-auto border-t border-slate-100 py-8">
        <div className="container mx-auto px-4 text-center text-sm font-medium text-slate-400">
          <p>{t("common.footer")}</p>
        </div>
      </footer>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
