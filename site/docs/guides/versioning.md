---
description: Guidelines for keeping our APIs stable
---

# Versioning

Our site provides versioned links to our JSON so that we have room for making breaking changes. We consider breaking changes to be:

- renaming object fields on already published resources
- changing the meaning, intent or expectation of an already published field or resource from what was previously documented

Things we don't consider to be breaking changes:

- correcting or changing values for a previously reported field
- adding new fields to an object that was previously published so long as it doesn't cause significant impact to an existing API's use (ie: download size)

## Upgrading a Dataset

When we issue a new version for an existing dataset, we update all references in our website documentation to the latest version to encourage migration. Generally, all that's required there is updating the reference to the enum value suffix representing the dataset version in the relevant doc mdx, for example:

`<JSONFileLinks resource="CasualtiesDaily_V2" />`

Here's [an example commit introducing some new resource versions](https://github.com/TechForPalestine/palestine-datasets/commit/b917024fd9097a8252c3e72c677722d5a8ed3cea#diff-34968d9c05a688d2db5c00cd46a15c4f503a4bd35e0b9eb0519e28c1aa21e499L2) where you'll see the same doc updates.
