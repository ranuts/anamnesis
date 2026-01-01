import "@rainbow-me/rainbowkit/styles.css"
import {
  getDefaultConfig,
  RainbowKitProvider,
  type Locale,
} from "@rainbow-me/rainbowkit"
import { WagmiProvider, http } from "wagmi"
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains"
import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
import { ReactNode, useEffect, useState } from "react"
import { useTranslation } from "@/i18n/config"

const config = getDefaultConfig({
  appName: "Anamnesis",
  projectId: "99c828d18e87483606f30d07521ca486", // Recommended: Use a real Project ID from https://cloud.reown.com/
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
      refetchOnWindowFocus: false,
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
        <RainbowKitProvider locale={locale}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
