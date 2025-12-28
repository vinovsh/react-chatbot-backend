import i18next from "i18next";
import Backend from "i18next-fs-backend";
import { handle as i18nextMiddleware, LanguageDetector } from "i18next-http-middleware";
import path from "path";

i18next
  .use(Backend)
  .use(LanguageDetector) // fixed: use named import
  .init({
    fallbackLng: "en",
    preload: ["en", "fr", "ta"],
    ns: ["auth", "common", "errors"], // namespaces
    defaultNS: "common",
    backend: {
      loadPath: path.join(__dirname, "..", "locales/{{lng}}/{{ns}}.json"),
    },
    detection: {
      order: ["header", "querystring", "cookie"],
      lookupHeader: "accept-language",
    },
    debug: false,
  });

export default i18next;
