import { useState } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
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
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import {
  getIrys,
  uploadToArweave,
  uploadToIrys,
  arweave,
  generateArweaveWallet,
} from "@/lib/storage"
import {
  Loader2,
  Upload,
  ExternalLink,
  HardDrive,
  Key,
  Download,
} from "lucide-react"

export default function App() {
  const { isConnected, address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [txId, setTxId] = useState<string | null>(null)
  const [arweaveKey, setArweaveKey] = useState<any>(null)
  const [newWalletAddress, setNewWalletAddress] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleCreateArWallet = async () => {
    try {
      const { key, address } = await generateArweaveWallet()
      const blob = new Blob([JSON.stringify(key)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `arweave-key-${address}.json`
      a.click()
      URL.revokeObjectURL(url)
      setNewWalletAddress(address)
      toast.success("New Arweave wallet generated and downloaded!")
    } catch (error: any) {
      toast.error(`Failed to generate wallet: ${error.message}`)
    }
  }

  const handleArweaveKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const key = JSON.parse(reader.result as string)
          setArweaveKey(key)
          toast.success("Arweave key loaded")
        } catch (error) {
          toast.error("Invalid Arweave key file")
        }
      }
      reader.readAsText(e.target.files[0])
    }
  }

  const onUploadArweave = async () => {
    if (!file || !arweaveKey) {
      toast.error("Please select a file and upload your Arweave key")
      return
    }

    setUploading(true)
    try {
      const id = await uploadToArweave(file, arweaveKey)
      setTxId(id as string)
      toast.success("Uploaded to Arweave!")
    } catch (error: any) {
      toast.error(`Arweave upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const onUploadIrys = async () => {
    if (!file || !walletClient) {
      toast.error("Please select a file and connect your wallet")
      return
    }

    setUploading(true)
    try {
      // @ts-ignore
      const irys = await getIrys(walletClient)
      const id = await uploadToIrys(file, irys)
      setTxId(id)
      toast.success("Uploaded to Irys!")
    } catch (error: any) {
      toast.error(`Irys upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <HardDrive className="h-8 w-8 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight">Anamnesis</h1>
          </div>
          <ConnectButton />
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-extrabold">
            Decentralized Data Storage
          </h2>
          <p className="text-lg text-slate-500">
            Store your files permanently on Arweave or Irys with ease.
          </p>
        </div>

        <Tabs defaultValue="irys" className="w-full">
          <TabsList className="mb-8 grid h-12 w-full grid-cols-2">
            <TabsTrigger value="irys" className="flex items-center gap-2">
              <IrysIcon className="h-4 w-4" /> Irys (Bundlr)
            </TabsTrigger>
            <TabsTrigger value="arweave" className="flex items-center gap-2">
              <ArweaveIcon className="h-4 w-4" /> Arweave Native
            </TabsTrigger>
          </TabsList>

          <TabsContent value="irys">
            <Card>
              <CardHeader>
                <CardTitle>Upload via Irys</CardTitle>
                <CardDescription>
                  Fast and scalable uploads using the Irys network. Requires
                  Ethereum wallet connection.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="file-irys">Choose File</Label>
                  <Input
                    id="file-irys"
                    type="file"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="flex flex-col gap-4">
                  {!isConnected ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Please connect your wallet to use Irys.
                    </div>
                  ) : (
                    <Button
                      className="h-12 w-full text-lg"
                      onClick={onUploadIrys}
                      disabled={uploading || !file}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-5 w-5" /> Upload to Irys
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="arweave">
            <Card>
              <CardHeader>
                <CardTitle>Native Arweave Upload</CardTitle>
                <CardDescription>
                  Direct upload to Arweave. Requires an Arweave wallet JSON
                  keyfile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="key-arweave">Arweave Keyfile (JSON)</Label>
                  <Input
                    id="key-arweave"
                    type="file"
                    accept=".json"
                    onChange={handleArweaveKeyChange}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="file-arweave">Choose File</Label>
                  <Input
                    id="file-arweave"
                    type="file"
                    onChange={handleFileChange}
                  />
                </div>

                <Button
                  className="h-12 w-full bg-black text-lg hover:bg-zinc-800"
                  onClick={onUploadArweave}
                  disabled={uploading || !file || !arweaveKey}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />{" "}
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" /> Upload to Arweave
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-12">
          <Card className="border-indigo-100 bg-indigo-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-indigo-600" />
                Wallet Tools
              </CardTitle>
              <CardDescription>
                Need an account? Generate a new Arweave wallet or manage your
                assets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  variant="outline"
                  className="flex-1 bg-white"
                  onClick={handleCreateArWallet}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Generate New Arweave Key
                </Button>
                <Button variant="outline" className="flex-1 bg-white" asChild>
                  <a
                    href="https://irys.xyz/docs/overview"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    How Irys Accounts Work
                  </a>
                </Button>
              </div>
              {newWalletAddress && (
                <div className="mt-4 rounded-md border border-indigo-100 bg-white p-3 text-sm text-slate-600 shadow-sm">
                  <span className="font-semibold text-indigo-700">
                    Latest generated address:
                  </span>{" "}
                  <code className="break-all">{newWalletAddress}</code>
                  <p className="mt-1 text-xs text-slate-400 italic">
                    * Make sure to keep your downloaded JSON keyfile safe!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {txId && (
          <Card className="mt-8 border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                Successfully Uploaded!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded border border-green-100 bg-white p-3">
                <code className="mr-4 truncate text-xs text-green-700">
                  {txId}
                </code>
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={`https://arweave.net/${txId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <footer className="mt-20 text-center text-sm text-slate-400">
          <p>© 2025 Anamnesis - Built with ❤️ for the Permaweb</p>
        </footer>
      </main>
      <Toaster position="bottom-right" />
    </div>
  )
}
