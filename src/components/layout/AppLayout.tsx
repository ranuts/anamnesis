import { ReactNode } from "react"
import { Navbar } from "./Navbar"
import { useTranslation } from "@/i18n/config"
import { Toaster } from "sonner"

export function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mt-8 mb-8">
        <div className="container mx-auto text-center text-sm font-medium text-slate-400">
          <p>{t("common.footer")}</p>
        </div>
      </footer>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
