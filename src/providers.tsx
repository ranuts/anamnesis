import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, type Locale } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const config = getDefaultConfig({
  appName: "Anamnesis",
  projectId: "YOUR_PROJECT_ID", // TODO: Replace with your Reown Project ID
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: false, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [locale, setLocale] = useState<Locale>("en-US");

  useEffect(() => {
    // Map i18next language to RainbowKit Locale
    const currentLang = i18n.language.startsWith("zh") ? "zh-CN" : "en-US";
    setLocale(currentLang as Locale);
  }, [i18n.language]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale={locale}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
