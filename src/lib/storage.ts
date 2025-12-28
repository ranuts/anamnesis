import Arweave from "arweave"
import { WebIrys } from "@irys/sdk"
import { BrowserProvider } from "ethers"

// Initialize Arweave
export const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
})

export const getIrys = async (provider: any) => {
  const ethersProvider = new BrowserProvider(provider)
  const wallet = { name: "ethersv6", provider: ethersProvider }
  const irys = new WebIrys({
    url: "https://node1.irys.xyz", // Mainnet
    token: "ethereum",
    wallet,
  })
  await irys.ready()
  return irys
}

export const uploadToArweave = async (file: File, key: any) => {
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const data = reader.result as ArrayBuffer
        const transaction = await arweave.createTransaction({ data }, key)
        transaction.addTag("Content-Type", file.type)
        transaction.addTag("App-Name", "Anamnesis")

        await arweave.transactions.sign(transaction, key)
        const response = await arweave.transactions.post(transaction)

        if (response.status === 200) {
          resolve(transaction.id)
        } else {
          reject(new Error(`Arweave upload failed: ${response.status}`))
        }
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export const uploadToIrys = async (file: File, irys: WebIrys) => {
  try {
    const tags = [{ name: "Content-Type", value: file.type }]
    const receipt = await irys.uploadFile(file, { tags })
    return receipt.id
  } catch (error) {
    console.error("Irys upload error:", error)
    throw error
  }
}
