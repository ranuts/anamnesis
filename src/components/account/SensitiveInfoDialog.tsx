import { useState } from "react"
import { useTranslation } from "@/i18n/config"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, ShieldAlert } from "lucide-react"

interface SensitiveInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: any
  type: "key" | "mnemonic"
  onVerify: (password: string) => Promise<{
    key: string
    mnemonic?: string
  } | null>
}

export function SensitiveInfoDialog({
  open,
  onOpenChange,
  type,
  onVerify,
}: SensitiveInfoDialogProps) {
  const { t } = useTranslation()
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [decryptedInfo, setDecryptedInfo] = useState<{
    key: string
    mnemonic?: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    setLoading(true)
    try {
      const info = await onVerify(confirmPassword)
      setDecryptedInfo(info)
      setConfirmPassword("")
    } catch (e) {
      // Error handled by onVerify
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setConfirmPassword("")
    setDecryptedInfo(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            {type === "key"
              ? t("identities.viewSensitive")
              : t("identities.mnemonic")}
          </DialogTitle>
          <DialogDescription>
            {t("identities.sensitiveWarning")}
          </DialogDescription>
        </DialogHeader>

        {!decryptedInfo ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                {t("identities.confirmPassword")}
              </p>
            </div>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("unlock.passwordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    handleVerify()
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-indigo-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <Button
              onClick={handleVerify}
              disabled={!confirmPassword || loading}
              className="w-full"
            >
              {loading ? t("common.loading") : t("identities.verify")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800">
                {t("identities.dangerZone")}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                {type === "key"
                  ? t("identities.privateKey")
                  : t("identities.mnemonic")}
              </label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="font-mono text-sm break-all text-slate-900">
                  {type === "key" ? decryptedInfo.key : decryptedInfo.mnemonic}
                </p>
              </div>
            </div>
            <Button onClick={handleClose} variant="outline" className="w-full">
              {t("common.close")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
