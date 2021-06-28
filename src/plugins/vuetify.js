import Vue from "vue";
import Vuetify from "vuetify/lib/framework";
import i18n from "./i18n";

import chain from "@/assets/icon/chain.png";
import daoBlack from "@/assets/icon/dao-black.png";
import daoGreen from "@/assets/icon/dao-green.png";
import dex from "@/assets/icon/dex.png";
import digital from "@/assets/icon/digital.png";
import efficient from "@/assets/icon/efficient.png";
import nft from "@/assets/icon/nft.svg";

Vue.use(Vuetify);

const MY_ICONS = {
  chain,
  daoBlack,
  daoGreen,
  dex,
  digital,
  efficient,
  nft
};

export default new Vuetify({
  lang: {
    t: (key, ...params) => i18n.t(key, params)
  },
  theme: {
    dark: false,
    themes: {
      light: {
        primary: "#93B954",
        secondary: "#050B1F",
        accent: "#204165"
      },
      dark: {
        primary: "#50778D",
        secondary: "#0B1C3D",
        accent: "#204165"
      }
    }
  },
  icons: {
    value: MY_ICONS
  }
});
