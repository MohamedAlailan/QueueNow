/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "../../i18n/en.json";
import ar from "../../i18n/ar.json";

const LanguageContext = createContext(null);
const dicts = { en, ar };
function lookup(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj) ?? path;
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() =>
    localStorage.getItem("queuenow-language") === "ar" ? "ar" : "en"
  );
  const direction = language === "ar" ? "rtl" : "ltr";
  const dictionary = dicts[language];
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    localStorage.setItem("queuenow-language", language);
  }, [language, direction]);
  const t = useMemo(
    () =>
      (key, params = {}) =>
        Object.entries(params).reduce(
          (value, [name, replacement]) =>
            String(value).replaceAll(`{{${name}}}`, replacement),
          lookup(dictionary, key)
        ),
    [dictionary]
  );
  const value = useMemo(
    () => ({ language, direction, setLanguage, t }),
    [language, direction, setLanguage, t]
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
