import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWalletClient } from "wagmi";
import { ArweaveIcon, IrysIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  getIrys,
  uploadToArweave,
  uploadToIrys,
  generateArweaveWallet,
} from "@/lib/storage";
import {
  Loader2,
  Upload,
  ExternalLink,
  HardDrive,
  Key,
  Download,
  Lock,
  Unlock,
  Plus,
  History,
  ShieldCheck,
  LayoutDashboard,
  Wallet,
} from "lucide-react";
import { useWalletManager } from "@/hooks/use-wallet-manager";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { HistoryTable } from "@/components/history-table";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function App() {
  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const walletManager = useWalletManager();
  
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [encryptUpload, setEncryptUpload] = useState(true);
  
  const uploadHistory = useLiveQuery(
    () => db.uploads.orderBy("createdAt").reverse().toArray(),
    []
  );

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error(t("unlock.errorLength"));
      return;
    }
    const success = await walletManager.unlock(password);
    if (success) {
      toast.success(t("unlock.success"));
    } else {
      toast.error(t("unlock.failed"));
    }
  };

  const handleCreateArWallet = async () => {
    try {
      const { key, address } = await generateArweaveWallet();
      const alias = prompt(t("identities.aliasPrompt"), `Wallet-${address.slice(0, 4)}`);
      if (!alias) return;
      
      await walletManager.addWallet(key, alias);
      
      const blob = new Blob([JSON.stringify(key)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `arweave-key-${address}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("identities.successGenerated"));
    } catch (error: any) {
      toast.error(t("identities.errorGenerate", { message: error.message }));
    }
  };

  const handleImportWallet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const key = JSON.parse(reader.result as string);
          const alias = prompt(t("identities.aliasPrompt"), file.name.replace(".json", ""));
          if (!alias) return;
          await walletManager.addWallet(key, alias);
          toast.success(t("identities.successAdded", { alias }));
        } catch (error) {
          toast.error("Invalid Arweave key file");
        }
      };
      reader.readAsText(file);
    }
  };

  const onUploadArweave = async () => {
    if (!file || !walletManager.activeWallet) {
      toast.error(t("upload.arweaveSelectIdentity"));
      return;
    }

    setUploading(true);
    try {
      await uploadToArweave(
        file, 
        walletManager.activeWallet, 
        encryptUpload ? walletManager.masterKey! : undefined
      );
      toast.success(t("upload.successArweave"));
      setFile(null);
    } catch (error: any) {
      toast.error(t("upload.failed", { protocol: "Arweave", message: error.message }));
    } finally {
      setUploading(false);
    }
  };

  const onUploadIrys = async () => {
    if (!file || !walletClient) {
      toast.error(t("upload.irysConnectWallet"));
      return;
    }

    setUploading(true);
    try {
      // @ts-ignore
      const irys = await getIrys(walletClient);
      await uploadToIrys(
        file, 
        irys, 
        encryptUpload ? walletManager.masterKey! : undefined
      );
      toast.success(t("upload.successIrys"));
      setFile(null);
    } catch (error: any) {
      toast.error(t("upload.failed", { protocol: "Irys", message: error.message }));
    } finally {
      setUploading(false);
    }
  };

  if (!walletManager.isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-slate-100">
          <CardHeader className="text-center">
            <div className="mx-auto bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">{t("common.appName")}</CardTitle>
            <CardDescription className="text-slate-400">
              {t("unlock.desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t("unlock.passwordLabel")}</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder={t("unlock.passwordPlaceholder")}
                  className="bg-slate-700 border-slate-600 text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                <Unlock className="mr-2 h-4 w-4" /> {t("unlock.submit")}
              </Button>
            </form>
            <p className="mt-6 text-xs text-slate-500 text-center">
              {t("unlock.warning")}
            </p>
          </CardContent>
        </Card>
        <Toaster theme="dark" position="bottom-right" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <HardDrive className="h-8 w-8 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight">{t("common.appName")}</h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="h-8 w-px bg-slate-200" />
            <ConnectButton />
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              {t("common.activeIdentity")}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="flex items-center justify-between mb-8">
            <TabsList className="grid w-80 grid-cols-2">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> {t("common.dashboard")}
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" /> {t("common.upload")}
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">{t("common.activeIdentity")}</div>
                <div className="text-sm font-semibold truncate max-w-[150px]">
                  {walletManager.activeAddress ? 
                    walletManager.wallets.find(w => w.address === walletManager.activeAddress)?.alias || "Unnamed" 
                    : t("common.noIdentity")}
                </div>
              </div>
            </div>
          </div>

          <TabsContent value="dashboard" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Identities Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-indigo-600" />
                      {t("identities.title")}
                    </CardTitle>
                    <CardDescription>{t("identities.desc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {walletManager.wallets.map((w) => (
                        <div 
                          key={w.id}
                          onClick={() => walletManager.selectWallet(w)}
                          className={`p-3 rounded-md border cursor-pointer transition-all ${
                            walletManager.activeAddress === w.address 
                            ? "border-indigo-600 bg-indigo-50" 
                            : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="font-semibold text-sm truncate">{w.alias}</div>
                          <div className="text-xs text-slate-500 truncate">{w.address}</div>
                        </div>
                      ))}
                      {walletManager.wallets.length === 0 && (
                        <div className="text-center py-6 text-slate-400 text-sm italic">
                          {t("identities.noWallets")}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={handleCreateArWallet}>
                        <Plus className="mr-1 h-3 w-3" /> {t("identities.new")}
                      </Button>
                      <div className="relative">
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="mr-1 h-3 w-3" /> {t("identities.import")}
                        </Button>
                        <input 
                          type="file" 
                          accept=".json" 
                          onChange={handleImportWallet}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Records Main View */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-600" />
                      {t("history.title")}
                    </CardTitle>
                    <CardDescription>
                      {t("history.desc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <HistoryTable 
                      records={uploadHistory || []} 
                      masterKey={walletManager.masterKey}
                      activeAddress={walletManager.activeAddress}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <div className="max-w-3xl mx-auto space-y-8">
              <Tabs defaultValue="irys" className="w-full">
                <TabsList className="mb-6 grid h-12 w-full grid-cols-2 bg-white border">
                  <TabsTrigger value="irys" className="flex items-center gap-2">
                    <IrysIcon className="h-4 w-4" /> Irys Network (Fast)
                  </TabsTrigger>
                  <TabsTrigger value="arweave" className="flex items-center gap-2">
                    <ArweaveIcon className="h-4 w-4" /> Arweave Native (Permanent)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="irys">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("upload.irysTitle")}</CardTitle>
                      <CardDescription>
                        {t("upload.irysDesc")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="file-irys">{t("upload.chooseFile")}</Label>
                        <Input
                          id="file-irys"
                          type="file"
                          onChange={(e) => e.target.files && setFile(e.target.files[0])}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="encrypt-irys" 
                          checked={encryptUpload} 
                          onChange={(e) => setEncryptUpload(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4"
                        />
                        <Label htmlFor="encrypt-irys" className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1.5">
                          {t("upload.enableEncryption")}
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                        </Label>
                      </div>

                      {!isConnected ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 text-center">
                          {t("upload.irysConnectWallet")}
                        </div>
                      ) : (
                        <Button
                          className="h-12 w-full text-lg shadow-lg shadow-indigo-100"
                          onClick={onUploadIrys}
                          disabled={uploading || !file}
                        >
                          {uploading ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("upload.uploading")}</>
                          ) : (
                            <><Upload className="mr-2 h-5 w-5" /> {t("upload.irysSubmit")}</>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="arweave">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("upload.arweaveTitle")}</CardTitle>
                      <CardDescription>
                        {t("upload.arweaveDesc")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="file-arweave">{t("upload.chooseFile")}</Label>
                        <Input
                          id="file-arweave"
                          type="file"
                          onChange={(e) => e.target.files && setFile(e.target.files[0])}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="encrypt-ar" 
                          checked={encryptUpload} 
                          onChange={(e) => setEncryptUpload(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4"
                        />
                        <Label htmlFor="encrypt-ar" className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1.5">
                          {t("upload.enableEncryption")}
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                        </Label>
                      </div>

                      {!walletManager.activeWallet ? (
                        <div className="rounded-md border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 text-center">
                          {t("upload.arweaveSelectIdentity")}
                        </div>
                      ) : (
                        <Button
                          className="h-12 w-full bg-black text-lg hover:bg-zinc-800 shadow-lg shadow-zinc-100"
                          onClick={onUploadArweave}
                          disabled={uploading || !file}
                        >
                          {uploading ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("upload.uploading")}</>
                          ) : (
                            <><Upload className="mr-2 h-5 w-5" /> {t("upload.arweaveSubmit")}</>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100 flex gap-4 items-start">
                <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
                <div className="text-sm text-indigo-900">
                  <p className="font-bold mb-1">{t("common.securityNotice")}</p>
                  <p className="leading-relaxed">
                    {t("common.securityNoticeDesc")}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <footer className="mt-8 mb-8">
        <div className="container mx-auto text-center text-sm text-slate-400">
          <p>{t("common.footer")}</p>
        </div>
      </footer>
      <Toaster position="bottom-right" />
    </div>
  );
}
