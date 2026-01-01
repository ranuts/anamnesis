import { useWallet } from "@/providers/wallet-provider"

// 保持向后兼容，方便之前的组件继续使用这个 Hook 名
export function useWalletManager() {
  return useWallet()
}
