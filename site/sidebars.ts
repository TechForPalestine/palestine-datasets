import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  docs: [
    {
      type: "category",
      label: "Datasets",
      link: {
        type: "doc",
        id: "datasets",
      },
      items: [
        "killed-in-gaza",
        "press-killed-in-gaza",
        "summary",
        "casualties-daily",
        "casualties-daily-west-bank",
        "infrastructure-damaged",
      ],
    },

    {
      type: "link",
      label: "Example Usage",
      href: "/docs/examples",
    },
    {
      type: "link",
      label: "Updates",
      href: "/updates",
    },
    {
      type: "category",
      label: "Contributing",
      link: { type: "doc", id: "guides/contributing" },
      items: ["guides/architecture", "guides/versioning"],
    },
    {
      type: "link",
      label: "Contact",
      href: "/docs/contact",
    },
  ],
};

export default sidebars;
