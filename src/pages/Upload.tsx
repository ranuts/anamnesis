import { useState } from "react"
import { useTranslation } from "@/i18n/config"
import { useAccount, useWalletClient } from "wagmi"
import { ArweaveIcon, IrysIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  getIrys,
  uploadToArweave,
  uploadToIrys,
  generateArweaveWallet,
} from "@/lib/storage"
import {
  Loader2,
  Upload,
  Lock,
  Plus,
  Download,
  ShieldCheck,
} from "lucide-react"
import { useWalletManager } from "@/hooks/use-wallet-manager"
import { Link } from "react-router-dom"

export default function UploadPage() {
  const { t } = useTranslation()
  const { isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const walletManager = useWalletManager()

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [encryptUpload, setEncryptUpload] = useState(true)

  const handleCreateArWallet = async () => {
    if (!walletManager.isUnlocked) {
      toast.error(t("history.errorLocked"))
      return
    }
    try {
      const { key, address } = await generateArweaveWallet()
      const alias = prompt(
        t("identities.aliasPrompt"),
        `Wallet-${address.slice(0, 4)}`,
      )
      if (!alias) return
      await walletManager.addWallet(key, alias)
      toast.success(t("identities.successGenerated"))
    } catch (error: any) {
      toast.error(t("identities.errorGenerate", { message: error.message }))
    }
  }

  const handleImportWallet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!walletManager.isUnlocked) {
      toast.error(t("history.errorLocked"))
      return
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const key = JSON.parse(reader.result as string)
          const alias = prompt(
            t("identities.aliasPrompt"),
            file.name.replace(".json", ""),
          )
          if (!alias) return
          await walletManager.addWallet(key, alias)
          toast.success(t("identities.successAdded", { alias }))
        } catch (error) {
          toast.error("Invalid Arweave key file")
        }
      }
      reader.readAsText(file)
    }
  }

  const onUploadArweave = async () => {
    if (!walletManager.isUnlocked) {
      toast.error(t("history.errorLocked"))
      return
    }
    if (!file || !walletManager.activeWallet) {
      toast.error(t("upload.arweaveSelectIdentity"))
      return
    }

    setUploading(true)
    try {
      await uploadToArweave(
        file,
        walletManager.activeWallet,
        encryptUpload ? walletManager.masterKey! : undefined,
      )
      toast.success(t("upload.successArweave"))
      setFile(null)
    } catch (error: any) {
      toast.error(
        t("upload.failed", { protocol: "Arweave", message: error.message }),
      )
    } finally {
      setUploading(false)
    }
  }

  const onUploadIrys = async () => {
    if (encryptUpload && !walletManager.isUnlocked) {
      toast.error(t("history.errorLocked"))
      return
    }
    if (!file || !walletClient) {
      toast.error(t("upload.irysConnectWallet"))
      return
    }

    setUploading(true)
    try {
      // @ts-ignore
      const irys = await getIrys(walletClient)
      await uploadToIrys(
        file,
        irys,
        encryptUpload ? walletManager.masterKey! : undefined,
      )
      toast.success(t("upload.successIrys"))
      setFile(null)
    } catch (error: any) {
      toast.error(
        t("upload.failed", { protocol: "Irys", message: error.message }),
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div className="mb-4 flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">
          {t("common.upload")}
        </h2>
        <p className="text-slate-500">{t("upload.irysDesc")}</p>
      </div>

      {!walletManager.isUnlocked && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
          <Lock className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="font-medium">
            {t("common.unlockRequired")}{" "}
            <Link to="/account" className="ml-1 font-bold underline">
              {t("upload.goToAccount")}
            </Link>
          </p>
        </div>
      )}

      <Tabs defaultValue="irys" className="w-full">
        <TabsList className="mb-6 grid h-14 w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
          <TabsTrigger
            value="irys"
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <IrysIcon className="h-4 w-4" /> Irys Network
          </TabsTrigger>
          <TabsTrigger
            value="arweave"
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <ArweaveIcon className="h-4 w-4" /> Arweave Native
          </TabsTrigger>
        </TabsList>

        <TabsContent value="irys" className="focus-visible:outline-hidden">
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">{t("upload.irysTitle")}</CardTitle>
              <CardDescription>{t("upload.irysDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid w-full items-center gap-1.5">
                <Label
                  htmlFor="file-irys"
                  className="text-sm font-bold text-slate-700"
                >
                  {t("upload.chooseFile")}
                </Label>
                <div className="mt-1.5">
                  <Input
                    id="file-irys"
                    type="file"
                    className="h-11 cursor-pointer border-slate-200"
                    onChange={(e) =>
                      e.target.files && setFile(e.target.files[0])
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <input
                  type="checkbox"
                  id="encrypt-irys"
                  checked={encryptUpload && walletManager.isUnlocked}
                  onChange={(e) => {
                    if (!walletManager.isUnlocked && e.target.checked) {
                      toast.error(t("history.errorLocked"))
                      return
                    }
                    setEncryptUpload(e.target.checked)
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
                <Label
                  htmlFor="encrypt-irys"
                  className="flex cursor-pointer items-center gap-2 text-sm leading-none font-semibold"
                >
                  {t("upload.enableEncryption")}
                  <ShieldCheck
                    className={`h-4 w-4 ${walletManager.isUnlocked ? "text-indigo-500" : "text-slate-300"}`}
                  />
                </Label>
              </div>

              {!isConnected ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-center text-sm font-medium text-amber-800 shadow-xs">
                  {t("upload.irysConnectWallet")}
                </div>
              ) : (
                <Button
                  className="h-14 w-full rounded-xl text-lg font-bold shadow-lg shadow-indigo-100"
                  onClick={onUploadIrys}
                  disabled={uploading || !file}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                      {t("upload.uploading")}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />{" "}
                      {encryptUpload && walletManager.isUnlocked
                        ? t("upload.irysSubmit")
                        : t("upload.irysSubmitPublic")}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arweave" className="focus-visible:outline-hidden">
          <Card
            className={`border-slate-200/60 shadow-sm ${!walletManager.isUnlocked ? "opacity-60" : ""}`}
          >
            <CardHeader>
              <CardTitle className="text-xl">
                {t("upload.arweaveTitle")}
              </CardTitle>
              <CardDescription>{t("upload.arweaveDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid w-full items-center gap-1.5">
                <Label
                  htmlFor="file-arweave"
                  className="text-sm font-bold text-slate-700"
                >
                  {t("upload.chooseFile")}
                </Label>
                <div className="mt-1.5">
                  <Input
                    id="file-arweave"
                    type="file"
                    disabled={!walletManager.isUnlocked}
                    className="h-11 cursor-pointer border-slate-200"
                    onChange={(e) =>
                      e.target.files && setFile(e.target.files[0])
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <input
                  type="checkbox"
                  id="encrypt-ar"
                  checked={encryptUpload}
                  onChange={(e) => setEncryptUpload(e.target.checked)}
                  disabled={!walletManager.isUnlocked}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
                <Label
                  htmlFor="encrypt-ar"
                  className="flex cursor-pointer items-center gap-2 text-sm leading-none font-semibold"
                >
                  {t("upload.enableEncryption")}
                  <ShieldCheck className="h-4 w-4 text-indigo-500" />
                </Label>
              </div>

              {!walletManager.isUnlocked ? (
                <div className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-8 text-center">
                  <Lock className="mx-auto h-10 w-10 text-indigo-400 opacity-50" />
                  <p className="text-sm font-medium text-indigo-900">
                    {t("upload.arweaveLockedHint")}
                  </p>
                  <Link to="/account">
                    <Button
                      variant="outline"
                      className="mt-2 border-indigo-200 hover:bg-indigo-100"
                    >
                      {t("common.account")}
                    </Button>
                  </Link>
                </div>
              ) : !walletManager.activeWallet ? (
                <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
                  <div className="text-sm font-bold text-slate-600">
                    {walletManager.wallets.length === 0
                      ? t("upload.arweaveNoIdentity")
                      : t("upload.arweaveSelectIdentity")}
                  </div>

                  {walletManager.wallets.length > 0 ? (
                    <div className="mx-auto grid max-w-xs grid-cols-1 gap-2">
                      {walletManager.wallets.map((w) => (
                        <Button
                          key={w.id}
                          variant="outline"
                          className="h-auto justify-start rounded-xl border-slate-200 px-4 py-3 text-left hover:border-indigo-600 hover:bg-indigo-50"
                          onClick={() => walletManager.selectWallet(w)}
                        >
                          <div className="w-full truncate">
                            <div className="text-sm font-bold text-slate-900">
                              {w.alias}
                            </div>
                            <div className="mt-0.5 max-w-[200px] truncate font-mono text-[10px] text-slate-500">
                              {w.address}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-center gap-3">
                      <Button
                        onClick={handleCreateArWallet}
                        className="rounded-lg"
                      >
                        <Plus className="mr-2 h-4 w-4" /> {t("identities.new")}
                      </Button>
                      <div className="relative">
                        <Button variant="outline" className="rounded-lg">
                          <Download className="mr-2 h-4 w-4" />{" "}
                          {t("identities.import")}
                        </Button>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportWallet}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  className="h-14 w-full rounded-xl bg-black text-lg font-bold text-white shadow-xl shadow-zinc-100 hover:bg-zinc-800"
                  onClick={onUploadArweave}
                  disabled={uploading || !file}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                      {t("upload.uploading")}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />{" "}
                      {t("upload.arweaveSubmit")}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-start gap-4 rounded-xl border border-indigo-100 bg-indigo-50 p-5 shadow-xs">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-indigo-600" />
        <div className="text-sm leading-relaxed text-indigo-900">
          <p className="mb-1 text-base font-bold">
            {t("common.securityNotice")}
          </p>
          <p className="opacity-90">{t("common.securityNoticeDesc")}</p>
        </div>
      </div>
    </div>
  )
}
