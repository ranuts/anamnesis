import { useState, useEffect, useCallback } from "react"
import { useAccount, useConnections } from "wagmi"
import { toast } from "sonner"
import { useTranslation } from "@/i18n/config"

export function useExternalWallets() {
  const { t } = useTranslation()
  const {
    address: paymentAddress,
    isConnected: isPaymentConnected,
    connector,
  } = useAccount()
  const connections = useConnections()

  // Arweave 外部账户状态
  const [arAddress, setArAddress] = useState<string | null>(null)
  const [isArConnected, setIsArConnected] = useState(false)

  // Solana 外部账户状态
  const [solAddress, setSolAddress] = useState<string | null>(null)
  const [isSolConnected, setIsSolConnected] = useState(false)

  // Sui 外部账户状态
  const [suiAddress, setSuiAddress] = useState<string | null>(null)
  const [isSuiConnected, setIsSuiConnected] = useState(false)

  // 所有 EVM 账户地址
  const [allEVMAddresses, setAllEVMAddresses] = useState<string[]>([])
  const [seenEVMAddresses, setSeenEVMAddresses] = useState<Set<string>>(
    new Set(),
  )

  // 检查 Arweave 连接
  const checkArConnect = useCallback(async () => {
    if (window.arweaveWallet) {
      try {
        const addr = await window.arweaveWallet.getActiveAddress()
        setArAddress(addr)
        setIsArConnected(true)
      } catch (e) {
        setIsArConnected(false)
        setArAddress(null)
      }
    }
  }, [])

  // 检查 Solana 连接 (静默检查)
  const checkSolConnect = useCallback(async () => {
    const solana = (window as any).solana
    if (solana && solana.isPhantom) {
      try {
        // 使用 onlyIfTrusted: true 进行静默检查，不会触发授权弹窗
        const resp = await solana.connect({ onlyIfTrusted: true })
        if (resp?.publicKey) {
          setSolAddress(resp.publicKey.toString())
          setIsSolConnected(true)
        }
      } catch (e) {
        // 如果未授权或失败，保持断开状态
        setIsSolConnected(false)
        setSolAddress(null)
      }
    } else {
      setIsSolConnected(false)
      setSolAddress(null)
    }
  }, [])

  // 检查 Sui 连接
  const checkSuiConnect = useCallback(async () => {
    const suiWallet = (window as any).suiWallet
    if (suiWallet) {
      try {
        const accounts = await suiWallet.getAccounts()
        if (accounts && accounts.length > 0) {
          setSuiAddress(accounts[0])
          setIsSuiConnected(true)
        }
      } catch (e) {
        setIsSuiConnected(false)
        setSuiAddress(null)
      }
    } else {
      setIsSuiConnected(false)
      setSuiAddress(null)
    }
  }, [])

  // 连接 Arweave
  const connectArweave = useCallback(async () => {
    if (!window.arweaveWallet) {
      window.open("https://www.arconnect.io/", "_blank")
      return
    }
    try {
      await window.arweaveWallet.connect([
        "ACCESS_ADDRESS",
        "ACCESS_ALL_ADDRESSES",
        "SIGN_TRANSACTION",
      ])
      await checkArConnect()
      toast.success(t("identities.paymentConnected"))
    } catch (e) {
      toast.error("ArConnect connection failed")
    }
  }, [checkArConnect, t])

  // 断开 Arweave
  const disconnectArweave = useCallback(async () => {
    if (window.arweaveWallet) {
      await window.arweaveWallet.disconnect()
      setIsArConnected(false)
      setArAddress(null)
      toast.success("已断开 ArConnect")
    }
  }, [])

  // 连接 Solana
  const connectSolana = useCallback(async () => {
    const solana = (window as any).solana
    if (!solana || !solana.isPhantom) {
      toast.error("请先安装 Phantom 钱包", {
        action: {
          label: "安装",
          onClick: () => window.open("https://phantom.app/", "_blank"),
        },
      })
      return
    }
    try {
      const resp = await solana.connect()
      if (resp?.publicKey) {
        setSolAddress(resp.publicKey.toString())
        setIsSolConnected(true)
        toast.success("Solana 钱包连接成功")
      }
    } catch (e: any) {
      if (e.code !== 4001) {
        toast.error("连接失败：" + (e.message || "未知错误"))
      }
    }
  }, [])

  // 断开 Solana
  const disconnectSolana = useCallback(async () => {
    const solana = (window as any).solana
    if (solana) {
      try {
        await solana.disconnect()
        setSolAddress(null)
        setIsSolConnected(false)
        toast.success("已断开 Solana 钱包")
      } catch (e) {
        console.error("Failed to disconnect Solana:", e)
      }
    }
  }, [])

  // 连接 Sui
  const connectSui = useCallback(async () => {
    const suiWallet = (window as any).suiWallet
    if (!suiWallet) {
      toast.error("请先安装 Sui Wallet", {
        action: {
          label: "安装",
          onClick: () =>
            window.open(
              "https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil",
              "_blank",
            ),
        },
      })
      return
    }
    try {
      await suiWallet.requestPermissions()
      const accounts = await suiWallet.getAccounts()
      if (accounts && accounts.length > 0) {
        setSuiAddress(accounts[0])
        setIsSuiConnected(true)
        toast.success("Sui 钱包连接成功")
      }
    } catch (e: any) {
      if (e.code !== 4001) {
        toast.error("连接失败：" + (e.message || "未知错误"))
      }
    }
  }, [])

  // 断开 Sui
  const disconnectSui = useCallback(async () => {
    const suiWallet = (window as any).suiWallet
    if (suiWallet) {
      try {
        await suiWallet.disconnect()
        setSuiAddress(null)
        setIsSuiConnected(false)
        toast.success("已断开 Sui 钱包")
      } catch (e) {
        console.error("Failed to disconnect Sui:", e)
      }
    }
  }, [])

  // 获取所有 EVM 账户地址
  useEffect(() => {
    const fetchAllEVMAddresses = async () => {
      if (!isPaymentConnected || !connector) {
        setAllEVMAddresses([])
        return
      }

      const addresses = new Set<string>()

      if (paymentAddress) {
        addresses.add(paymentAddress)
      }

      seenEVMAddresses.forEach((addr) => {
        addresses.add(addr)
      })

      if (connections && Array.isArray(connections) && connections.length > 0) {
        connections.forEach((conn) => {
          if (
            conn.accounts &&
            Array.isArray(conn.accounts) &&
            conn.accounts.length > 0
          ) {
            conn.accounts.forEach((acc: { address: string }) => {
              if (acc && acc.address) {
                addresses.add(acc.address)
              }
            })
          }
        })
      }

      try {
        if ("provider" in connector && connector.provider) {
          const provider = (connector as any).provider
          if (provider && typeof provider.request === "function") {
            const accounts = await provider.request({ method: "eth_accounts" })
            if (accounts && Array.isArray(accounts)) {
              accounts.forEach((addr: string) => {
                if (addr && typeof addr === "string") {
                  addresses.add(addr)
                }
              })
            }
          }
        }
      } catch (e) {
        console.debug("Failed to fetch all EVM accounts:", e)
      }

      setSeenEVMAddresses((prev) => {
        const newSet = new Set(prev)
        addresses.forEach((addr) => newSet.add(addr))
        return newSet
      })

      setAllEVMAddresses(Array.from(addresses))
    }

    fetchAllEVMAddresses()

    if (connector && "provider" in connector && connector.provider) {
      const provider = (connector as any).provider
      if (provider && typeof provider.on === "function") {
        const handleAccountsChanged = (accounts: string[]) => {
          console.log("Accounts changed:", accounts)
          setSeenEVMAddresses((prev) => {
            const newSet = new Set(prev)
            if (accounts && Array.isArray(accounts)) {
              accounts.forEach((addr: string) => {
                if (addr && typeof addr === "string") {
                  newSet.add(addr)
                }
              })
            }
            return newSet
          })
          fetchAllEVMAddresses()
        }

        provider.on("accountsChanged", handleAccountsChanged)

        return () => {
          if (provider && typeof provider.removeListener === "function") {
            provider.removeListener("accountsChanged", handleAccountsChanged)
          }
        }
      }
    }
  }, [isPaymentConnected, paymentAddress, connector, connections])

  // 监听 Arweave 切换
  useEffect(() => {
    // 移除了初始挂载时的 checkArConnect()，避免在未操作时触发可能的插件弹窗
    // 只在插件发出 walletSwitch 事件时进行检查
    window.addEventListener("walletSwitch", checkArConnect)
    return () => window.removeEventListener("walletSwitch", checkArConnect)
  }, [checkArConnect])

  // 检查 Solana 连接 (仅在挂载时尝试静默恢复)
  useEffect(() => {
    checkSolConnect()
  }, [checkSolConnect])

  // 移除了初始挂载时的 checkSuiConnect()，避免自动触发可能的授权请求
  // 用户需要点击“连接”按钮来触发授权

  return {
    // EVM
    paymentAddress,
    isPaymentConnected,
    allEVMAddresses,
    // Arweave
    arAddress,
    isArConnected,
    connectArweave,
    disconnectArweave,
    // Solana
    solAddress,
    isSolConnected,
    connectSolana,
    disconnectSolana,
    // Sui
    suiAddress,
    isSuiConnected,
    connectSui,
    disconnectSui,
  }
}
