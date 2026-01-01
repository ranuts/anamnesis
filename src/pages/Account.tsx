import { useState } from "react";
import { useTranslation } from "@/i18n/config";
import { useWalletManager } from "@/hooks/use-wallet-manager";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  Plus,
  Lock,
  ShieldCheck,
  Info,
  ShieldAlert,
  Copy,
  Eye,
  LogOut,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trans } from "react-i18next";

export default function AccountPage() {
  const { t } = useTranslation();
  const walletManager = useWalletManager();
  const [password, setPassword] = useState("");
  const [newWalletInput, setNewWalletInput] = useState("");
  const [newWalletAlias, setNewWalletAlias] = useState("");
  
  // 查看隐私相关
  const [showSensitiveDialog, setShowSensitiveDialog] = useState(false);
  const [sensitiveWallet, setSensitiveWallet] = useState<any>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [decryptedKey, setDecryptedKey] = useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await walletManager.unlock(password);
    if (success) setPassword("");
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletInput || !newWalletAlias) {
      toast.error(t("identities.keyPlaceholder"));
      return;
    }
    await walletManager.addWallet(newWalletInput, newWalletAlias);
    setNewWalletInput("");
    setNewWalletAlias("");
  };

  const handleCreateWallet = async (chain: any) => {
    const alias = prompt(t("identities.aliasPrompt"), `${chain.toUpperCase()}-Account`);
    if (!alias) return;
    await walletManager.createWallet(chain, alias);
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success(t("identities.copySuccess", { address: `${address.slice(0, 6)}...${address.slice(-4)}` }));
  };

  const handleShowSensitive = (wallet: any) => {
    setSensitiveWallet(wallet);
    setConfirmPassword("");
    setDecryptedKey(null);
    setShowSensitiveDialog(true);
  };

  const verifyAndShow = async () => {
    try {
      const key = await walletManager.getDecryptedKey(sensitiveWallet, confirmPassword);
      setDecryptedKey(key);
    } catch (e) {
      toast.error(t("unlock.incorrect"));
    }
  };

  const renderWalletList = (chain: string) => {
    const filtered = walletManager.wallets.filter(w => w.chain === chain);
    if (filtered.length === 0) {
      return (
        <div className="text-center py-8 text-slate-400 italic border-2 border-dashed rounded-xl">
          {t("identities.emptyState", { chain })}
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {filtered.map(w => (
          <div key={w.id} className="p-4 bg-white border border-slate-100 rounded-xl flex items-center justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 truncate">{w.alias}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                  <span className="truncate max-w-[150px] sm:max-w-none">{w.address}</span>
                  <button onClick={() => copyAddress(w.address)} className="p-1 hover:text-indigo-600">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleShowSensitive(w)} className="text-slate-400 hover:text-indigo-600">
              <Eye className="w-4 h-4 mr-2" />
              {t("identities.viewSensitive")}
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">{t("common.account")}</h2>
          <p className="text-slate-500">{t("identities.multiChainDesc")}</p>
        </div>
        {walletManager.isUnlocked && (
          <Button variant="outline" size="sm" onClick={walletManager.logout} className="text-red-500 border-red-100 hover:bg-red-50">
            <LogOut className="w-4 h-4 mr-2" /> {t("identities.logout")}
          </Button>
        )}
      </div>

      {!walletManager.isUnlocked ? (
        <Card className="border-indigo-100 shadow-xl overflow-hidden">
          <div className="h-2 w-full bg-linear-to-r from-indigo-600 to-violet-700" />
          <CardHeader className="pt-8 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Lock className="w-8 h-8 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl">{t("unlock.accessTitle")}</CardTitle>
            <CardDescription className="text-base max-w-md mx-auto">
              {t("unlock.accessDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-12">
            <form onSubmit={handleUnlock} className="space-y-4 max-w-sm mx-auto">
              <Input
                type="password"
                placeholder={t("unlock.passwordPlaceholder")}
                className="h-12 text-center text-lg border-slate-200 focus:ring-indigo-500 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg shadow-indigo-100 rounded-xl bg-indigo-600 hover:bg-indigo-700">
                {t("unlock.submit")} <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="ethereum" className="w-full">
              <TabsList className="w-full justify-start h-auto p-1 bg-slate-100 rounded-xl mb-6 flex-wrap">
                {["ethereum", "bitcoin", "solana", "sui", "arweave"].map(chain => (
                  <TabsTrigger key={chain} value={chain} className="px-6 py-2.5 rounded-lg capitalize data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    {chain}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="ethereum">{renderWalletList("ethereum")}</TabsContent>
              <TabsContent value="bitcoin">{renderWalletList("bitcoin")}</TabsContent>
              <TabsContent value="solana">{renderWalletList("solana")}</TabsContent>
              <TabsContent value="sui">{renderWalletList("sui")}</TabsContent>
              <TabsContent value="arweave">{renderWalletList("arweave")}</TabsContent>
            </Tabs>

            <Card className="border-slate-200/60 shadow-sm overflow-hidden">
              <Tabs defaultValue="import">
                <div className="bg-slate-50 px-6 py-2 border-b border-slate-100 flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
                    <Plus className="w-5 h-5" /> {t("identities.addNew")}
                  </CardTitle>
                  <TabsList className="bg-slate-200/50 p-1 h-9">
                    <TabsTrigger value="import" className="text-xs px-3 py-1.5">{t("identities.import")}</TabsTrigger>
                    <TabsTrigger value="create" className="text-xs px-3 py-1.5">{t("identities.new")}</TabsTrigger>
                  </TabsList>
                </div>

                <CardContent className="p-6">
                  <TabsContent value="import" className="mt-0">
                    <form onSubmit={handleAddWallet} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">{t("identities.aliasLabel")}</label>
                          <Input 
                            placeholder={t("identities.aliasPlaceholder")}
                            value={newWalletAlias}
                            onChange={(e) => setNewWalletAlias(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">{t("identities.keyLabel")}</label>
                          <Input 
                            type="password"
                            placeholder={t("identities.keyPlaceholder")}
                            value={newWalletInput}
                            onChange={(e) => setNewWalletInput(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                        {t("identities.addSubmit")}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="create" className="mt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { id: "ethereum", name: "Ethereum / Base / Hyper", icon: <Wallet className="w-4 h-4" /> },
                        { id: "bitcoin", name: "Bitcoin", icon: <Wallet className="w-4 h-4" /> },
                        { id: "solana", name: "Solana", icon: <Wallet className="w-4 h-4" /> },
                        { id: "sui", name: "Sui", icon: <Wallet className="w-4 h-4" /> },
                        { id: "arweave", name: "Arweave", icon: <Wallet className="w-4 h-4" /> },
                      ].map((chain) => (
                        <Button
                          key={chain.id}
                          variant="outline"
                          onClick={() => handleCreateWallet(chain.id)}
                          className="h-20 flex flex-col gap-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/30 rounded-xl"
                        >
                          <div className="p-2 bg-slate-50 rounded-lg text-slate-600 group-hover:text-indigo-600">
                            {chain.icon}
                          </div>
                          <span className="text-xs font-bold text-slate-700">{chain.name}</span>
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-green-50 border border-green-100 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-green-900">{t("identities.activeVault")}</h3>
              </div>
              <div className="text-xs text-green-700 font-mono break-all opacity-70">
                ID: {walletManager.vaultId}
              </div>
              <p className="mt-4 text-sm text-green-800 leading-relaxed">
                {t("identities.vaultDesc")}
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-indigo-500" /> {t("identities.securityInfo")}
              </h3>
              <ul className="space-y-3 text-xs text-slate-500 leading-relaxed">
                <li>• {t("identities.securityItem1")}</li>
                <li>• {t("identities.securityItem2")}</li>
                <li>• {t("identities.securityItem3")}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Sensitive Info Dialog */}
      <Dialog open={showSensitiveDialog} onOpenChange={setShowSensitiveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              {t("identities.viewSensitiveTitle")}
            </DialogTitle>
            <DialogDescription>
              <Trans 
                i18nKey="identities.viewSensitiveDesc" 
                values={{ alias: sensitiveWallet?.alias }} 
                components={{ strong: <strong /> }}
              />
            </DialogDescription>
          </DialogHeader>
          
          {!decryptedKey ? (
            <div className="space-y-4 py-4">
              <Input
                type="password"
                placeholder={t("unlock.passwordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button onClick={verifyAndShow} className="w-full bg-indigo-600">{t("identities.verifyPassword")}</Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-900 rounded-xl">
                <p className="text-xs font-mono text-green-400 break-all leading-relaxed">
                  {decryptedKey}
                </p>
              </div>
              <Button onClick={() => copyAddress(decryptedKey)} variant="outline" className="w-full">
                <Copy className="w-4 h-4 mr-2" /> {t("common.copy")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
