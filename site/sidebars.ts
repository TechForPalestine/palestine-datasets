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
        type: "generated-index",
        title: "Datasets",
      },
      items: ["killed-in-gaza", "casualties-daily", "summary"],
    },
    {
      type: "link",
      label: "Updates",
      href: "/updates",
    },
    {
      type: "link",
      label: "Example Usage",
      href: "/docs/examples",
    },
    {
      type: "category",
      label: "Guides",
      link: {
        type: "generated-index",
        title: "Guides",
      },
      items: [
        "guides/contributing",
        "guides/architecture",
        "guides/versioning",
      ],
    },
    {
      type: "link",
      label: "Contact us",
      href: "/docs/contact",
    },
  ],
};

export default sidebars;
