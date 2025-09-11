import type { Configuration } from "webpack";
import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import { getHeaderMarqueeInitialPage } from "./src/components/KilledHeaderMarquee/ssr-vars";

const siteTitle = "Palestine Datasets";
const repoUrl = "https://github.com/TechForPalestine/palestine-datasets";

const config: Config = {
  title: siteTitle,
  tagline:
    "Helping you tell their story. We provide datasets relevant to the ongoing human catastrophe in Palestine since October 7.",
  favicon: "img/tfp-mark-header.png",

  url: "https://data.techforpalestine.org",
  baseUrl: "/",
  trailingSlash: true,

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  customFields: {
    marqueeInitialPage: getHeaderMarqueeInitialPage(),
  },

  plugins: [
    async function redirectPlugin(context, options) {
      return {
        name: "plugin-local-api-resources",
        configureWebpack(_config, _isServer, _utils): Configuration {
          const fs = require("node:fs") as typeof import("fs");
          return {
            devServer: {
              setupMiddlewares(middlewares, _devServer) {
                middlewares.unshift({
                  name: "local-api-resources",
                  middleware: (req, res, next) => {
                    switch (req.path) {
                      case "/api/v3/killed-in-gaza.min.json": {
                        res.header("Content-Type", "application/json");
                        fs.createReadStream(
                          "../killed-in-gaza-v3.min.json"
                        ).pipe(res);
                        return;
                      }
                    }
                    next();
                  },
                });
                return middlewares;
              },
            },
          };
        },
      };
    },
  ],

  i18n: {
    defaultLocale: "en",
    locales: ["en", "ar"],
    localeConfigs: {
      en: {
        label: "English",
        direction: "ltr",
        htmlLang: "en-US",
      },
      fa: {
        label: "Arabic",
        direction: "rtl",
        htmlLang: "ar-PS",
      },
    },
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
        blog: {
          path: "updates",
          routeBasePath: "updates",
          blogTitle: "Updates",
          blogSidebarTitle: "Recent Updates",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/metathumbnail.png",
    navbar: {
      title: siteTitle,
      logo: {
        alt: `${siteTitle} Logo`,
        src: "img/tfp-mark-header.png",
      },
      items: [
        {
          to: "list",
          label: "Names",
        },
        {
          to: "docs/datasets/",
          label: "Datasets",
        },
        {
          to: "docs/examples/",
          label: "Examples",
        },
        {
          to: "updates/",
          label: "Updates",
        },
        {
          to: "docs/contact",
          label: "Contact",
        },
        {
          href: repoUrl,
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      logo: {
        alt: "Tech For Palestine Logo",
        src: "img/logo.svg",
        href: "https://techforpalestine.org",
        width: 80,
        height: 65,
      },
      copyright: `An open source initiative of the Tech For Palestine collective`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
