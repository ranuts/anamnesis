import "@rainbow-me/rainbowkit/styles.css"
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { WagmiProvider } from "wagmi"
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { ReactNode } from "react"

const config = getDefaultConfig({
  appName: "Anamnesis",
  projectId: "YOUR_PROJECT_ID", // TODO: Replace with your Reown Project ID
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: false, // If your dApp uses server side rendering (SSR)
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
