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
      items: [
        {
          type: "category",
          label: "Killed in Gaza",
          link: { type: "doc", id: "killed-in-gaza" },
          items: ["killed-in-gaza-indexes", "killed-in-gaza-person"],
        },
        "casualties-daily",
        "summary",
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
      label: "Contact us",
      href: "/docs/contact",
    },
  ],
};

export default sidebars;
