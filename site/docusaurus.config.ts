import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import { getHeaderMarqueeInitialPage } from "./src/components/KilledHeaderMarquee/ssr-vars";

const siteTitle = "Palestine Datasets";
const repoUrl = "https://github.com/TechForPalestine/palestine-datasets";

const config: Config = {
  title: siteTitle,
  tagline: "Telling their stories through names and numbers",
  favicon: "img/favicon.svg",

  url: "https://data.techforpalestine.org",
  baseUrl: "/",
  trailingSlash: true,

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  customFields: {
    marqueeInitialPage: getHeaderMarqueeInitialPage(),
  },

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
    // Replace with your project's social card
    // image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: siteTitle,
      logo: {
        alt: `${siteTitle} Logo`,
        src: "img/logo.svg",
      },
      items: [
        {
          to: "docs/category/datasets/",
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
      links: [
        {
          label: "Tech For Palestine",
          href: "https://techforpalestine.org/",
        },
      ],
      copyright: `An open source initiative of the Tech For Palestine collective`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
