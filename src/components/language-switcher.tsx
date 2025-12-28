import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith("zh") ? "en" : "zh";
    i18n.changeLanguage(newLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2 text-slate-600 hover:text-indigo-600"
    >
      <Languages className="w-4 h-4" />
      <span className="text-xs font-medium uppercase">
        {i18n.language.startsWith("zh") ? "EN" : "中文"}
      </span>
    </Button>
  );
}

