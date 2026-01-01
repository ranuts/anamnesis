import { useState } from "react"
import { useTranslation } from "@/i18n/config"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, Eye, EyeOff, ChevronRight } from "lucide-react"

interface UnlockFormProps {
  onUnlock: (password: string) => Promise<boolean>
}

export function UnlockForm({ onUnlock }: UnlockFormProps) {
  const { t } = useTranslation()
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await onUnlock(password)
    if (success) setPassword("")
  }

  return (
    <Card className="overflow-hidden border-indigo-100 shadow-xl">
      <div className="h-2 w-full bg-linear-to-r from-indigo-600 to-violet-700" />
      <CardHeader className="pt-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
          <Lock className="h-8 w-8 text-indigo-600" />
        </div>
        <CardTitle className="text-2xl">{t("unlock.accessTitle")}</CardTitle>
        <CardDescription className="mx-auto max-w-md text-base">
          {t("unlock.accessDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-12">
        <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={t("unlock.passwordPlaceholder")}
              className="h-12 rounded-xl border-slate-200 pr-12 text-center text-lg focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 transition-colors hover:text-indigo-600"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-indigo-600 text-lg font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700"
          >
            {t("unlock.submit")} <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
