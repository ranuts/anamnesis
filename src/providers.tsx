import "@rainbow-me/rainbowkit/styles.css"
import {
  getDefaultConfig,
  RainbowKitProvider,
  type Locale,
} from "@rainbow-me/rainbowkit"
import { WagmiProvider, http } from "wagmi"
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { type ReactNode, useEffect, useState } from "react"
import { useTranslation } from "@/i18n/config"
import { WalletProvider } from "@/providers/wallet-provider"

const config = getDefaultConfig({
  appName: "Anamnesis",
  projectId: "YOUR_PROJECT_ID", // Replace with your actual project ID
  chains: [mainnet, polygon, optimism, arbitrum, base],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
  ssr: false,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [locale, setLocale] = useState<Locale>("en-US")

  useEffect(() => {
    // Map i18next language to RainbowKit Locale
    const currentLang = i18n.language.startsWith("zh") ? "zh-CN" : "en-US"
    setLocale(currentLang as Locale)
  }, [i18n.language])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale={locale}>
          <WalletProvider>{children}</WalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
