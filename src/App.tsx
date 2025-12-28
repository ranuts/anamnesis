import { useState, useEffect } from "react";
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
  
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [encryptUpload, setEncryptUpload] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);
  
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
      setPassword(""); // Clear password after success
    } else {
      toast.error(t("unlock.failed"));
    }
  };

  const handleCreateArWallet = async () => {
    if (!walletManager.isUnlocked) {
      toast.error(t("history.errorLocked"));
      return;
    }
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
    if (!walletManager.isUnlocked) {
      toast.error(t("history.errorLocked"));
      return;
    }
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
    if (!walletManager.isUnlocked) {
      toast.error(t("history.errorLocked"));
      return;
    }
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
    if (encryptUpload && !walletManager.isUnlocked) {
      toast.error(t("history.errorLocked"));
      return;
    }
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

  if (!mounted) return null;

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
            <div className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full border ${
              walletManager.isUnlocked 
              ? "text-green-600 bg-green-50 border-green-200" 
              : "text-amber-600 bg-amber-50 border-amber-200"
            }`}>
              {walletManager.isUnlocked ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {walletManager.isUnlocked ? t("common.activeIdentity") : t("common.identityLocked")}
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
                {!walletManager.isUnlocked && (
                  <Card className="bg-linear-to-br from-indigo-600 to-violet-700 text-white border-none shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        {t("unlock.title")}
                      </CardTitle>
                      <CardDescription className="text-indigo-100 text-xs">
                        {t("unlock.desc")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <form onSubmit={handleUnlock} className="space-y-3">
                        <Input 
                          type="password" 
                          placeholder={t("unlock.passwordPlaceholder")}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-9 text-sm"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button type="submit" variant="secondary" size="sm" className="w-full h-9">
                          {t("unlock.submit")}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <Card className={!walletManager.isUnlocked ? "opacity-60 grayscale-[0.5] pointer-events-none" : ""}>
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
                          className={`p-3 rounded-md border transition-all cursor-pointer ${
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
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-600" />
                        {t("history.title")}
                      </CardTitle>
                      <CardDescription>
                        {t("history.desc")}
                      </CardDescription>
                    </div>
                    {!walletManager.isUnlocked && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        <Lock className="w-3 h-3" />
                        {t("common.identityLocked")}
                      </div>
                    )}
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
              {!walletManager.isUnlocked && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-800 text-sm">
                  <Lock className="w-4 h-4 shrink-0" />
                  <p>
                    {t("common.unlockRequired")}
        </p>
      </div>
              )}
              
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
                          checked={encryptUpload && walletManager.isUnlocked} 
                          onChange={(e) => {
                            if (!walletManager.isUnlocked && e.target.checked) {
                              toast.error(t("history.errorLocked"));
                              return;
                            }
                            setEncryptUpload(e.target.checked);
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4"
                        />
                        <Label htmlFor="encrypt-irys" className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1.5">
                          {t("upload.enableEncryption")}
                          <ShieldCheck className={`w-3.5 h-3.5 ${walletManager.isUnlocked ? "text-indigo-500" : "text-slate-300"}`} />
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
                            <><Upload className="mr-2 h-5 w-5" /> {encryptUpload && walletManager.isUnlocked ? t("upload.irysSubmit") : "Upload to Irys (Public)"}</>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="arweave">
                  <Card className={!walletManager.isUnlocked ? "opacity-60" : ""}>
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
                              disabled={!walletManager.isUnlocked}
                              onChange={(e) => e.target.files && setFile(e.target.files[0])}
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              id="encrypt-ar" 
                              checked={encryptUpload} 
                              onChange={(e) => setEncryptUpload(e.target.checked)}
                              disabled={!walletManager.isUnlocked}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4"
                            />
                            <Label htmlFor="encrypt-ar" className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1.5">
                              {t("upload.enableEncryption")}
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                            </Label>
                          </div>

                          {!walletManager.isUnlocked ? (
                            <div className="rounded-md border border-indigo-100 bg-indigo-50 px-4 py-6 text-center space-y-3">
                              <Lock className="w-8 h-8 text-indigo-400 mx-auto" />
                              <p className="text-sm text-indigo-800">
                                {t("upload.arweaveLockedHint")}
                              </p>
                              <Button variant="outline" size="sm" onClick={() => document.querySelector('[value="dashboard"]')?.dispatchEvent(new MouseEvent('click', {bubbles: true}))}>
                                {t("common.goToDashboard")}
                              </Button>
                            </div>
                          ) : !walletManager.activeWallet ? (
                            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-center space-y-4">
                              <div className="text-sm text-slate-600 font-medium">
                                {walletManager.wallets.length === 0 
                                  ? t("upload.arweaveNoIdentity") 
                                  : t("upload.arweaveSelectIdentity")}
                              </div>
                              
                              {walletManager.wallets.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2 max-w-xs mx-auto">
                                  {walletManager.wallets.map(w => (
                                    <Button 
                                      key={w.id} 
                                      variant="outline" 
                                      className="justify-start text-left h-auto py-2"
                                      onClick={() => walletManager.selectWallet(w)}
                                    >
                                      <div className="truncate">
                                        <div className="font-bold text-xs">{w.alias}</div>
                                        <div className="text-[10px] text-slate-500 opacity-70">{w.address}</div>
                                      </div>
                                    </Button>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex justify-center gap-2">
                                  <Button size="sm" onClick={handleCreateArWallet}>
                                    <Plus className="mr-1 h-3 w-3" /> {t("identities.new")}
                                  </Button>
                                  <div className="relative">
                                    <Button size="sm" variant="outline">
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
                              )}
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
