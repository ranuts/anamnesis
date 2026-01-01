import i18n from "i18next"
import {
  initReactI18next,
  type UseTranslationOptions,
  useTranslation as useAppTranslation,
} from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import en from "./locales/en.json"
import zh from "./locales/zh.json"

const resources = {
  en: { translation: en },
  zh: { translation: zh },
} as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  })

export const useTranslation = (props: UseTranslationOptions<undefined> = {}) =>
  useAppTranslation("translation", {
    ...props,
    i18n,
  })

export const t = i18n.t.bind(i18n)

export default i18n

declare module "i18next" {
  interface CustomTypeOptions {
    resources: (typeof resources)["zh"]
  }
}
