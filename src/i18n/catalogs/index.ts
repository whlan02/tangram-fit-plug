import type { Locale } from "../locales";
import { en } from "./en";
import { zhHans } from "./zh-Hans";
import { zhHant } from "./zh-Hant";
import { es } from "./es";
import { fr } from "./fr";
import { de } from "./de";
import { it } from "./it";
import { ptBR } from "./pt-BR";
import { ptPT } from "./pt-PT";
import { ru } from "./ru";
import { ja } from "./ja";
import { ko } from "./ko";
import { tr } from "./tr";
import { nl } from "./nl";
import { pl } from "./pl";
import { sv } from "./sv";
import { da } from "./da";
import { nb } from "./nb";
import { fi } from "./fi";
import { cs } from "./cs";
import { el } from "./el";
import { th } from "./th";
import { vi } from "./vi";
import { id } from "./id";
import { ms } from "./ms";
import { uk } from "./uk";
import { ro } from "./ro";
import { hu } from "./hu";
import { bg } from "./bg";
import { hr } from "./hr";
import { sk } from "./sk";
import { sl } from "./sl";
import { lt } from "./lt";
import { lv } from "./lv";
import { et } from "./et";
import { ca } from "./ca";
import { hi } from "./hi";
import { fil } from "./fil";

import type { Catalog } from "./en";

export type { Catalog, MsgKey } from "./en";

export const catalogs: Record<Locale, Partial<Catalog>> = {
  en,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
  es,
  fr,
  de,
  it,
  "pt-BR": ptBR,
  "pt-PT": ptPT,
  ru,
  ja,
  ko,
  tr,
  nl,
  pl,
  sv,
  da,
  nb,
  fi,
  cs,
  el,
  th,
  vi,
  id,
  ms,
  uk,
  ro,
  hu,
  bg,
  hr,
  sk,
  sl,
  lt,
  lv,
  et,
  ca,
  hi,
  fil,
};
