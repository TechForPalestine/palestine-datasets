---
title: Improved Name Translations
description: Describing the latest changes to our list of names dataset, and what to look out for.
slug: killed-in-gaza-update-1
tags: [killed-in-gaza]
---

We've made some significant changes to our previously published [Killed in Gaza list](/docs/killed-in-gaza), which has the names of those known to have been killed in Gaza since October 7th. This post provides more detail on our new methodology and what to expect about the changes.

## Prior Method

Our prior list relied heavily on an existing library ([arabic-names-to-en](https://github.com/hamdongunner/arabic-names-to-en)) which first tried to translate a name segment using a dictionary mapping, then fell back to a character-by-character lookup. We then had some volunteers do a visual review and incorporated manual changes. For a list of over 14 thousand names, this proved hard to manage.

## New Method

We've since built our own dictionary mapping with more name coverage, and the process now looks like this:

1. clean arabic names in the [original list](https://github.com/TechForPalestine/palestine-datasets/tree/main/scripts/data/common/killed-in-gaza/data/raw.csv) of formatting issues (using [dict_ar_ar.csv](https://github.com/TechForPalestine/palestine-datasets/tree/main/scripts/data/common/killed-in-gaza/data/dict_ar_ar.csv))
1. lookup / translate each name part into english (using [dict_ar_en.csv](https://github.com/TechForPalestine/palestine-datasets/tree/main/scripts/data/common/killed-in-gaza/data/dict_ar_en.csv))
1. run final transformations when converting to JSON (see [JSON export script](https://github.com/TechForPalestine/palestine-datasets/tree/main/scripts/data/v2/killed-in-gaza.ts))

The final step includes a fallback step to rely on the old library for remaining arabic translations that are not yet in our curated `dict_ar_ar.csv`. Currently there are less than 2% of the names partially handled by this fallback mechanism, and we'll be working to reduce that number.

## Notable Changes

We've avoided what we believe would have been breaking changes to the dataset per our [versioning guide](/docs/guides/versioning), but we did add 21 new records from the original official list released in November 2023. The IDs that were introduced from that November list include:

- 401771530
- 401844790
- 405424524
- 407194836
- 411518053
- 425923364
- 436788202
- 437391725
- 438240293
- 438445371
- 441199296
- 800328817
- 802335927
- 803827518
- 804662112
- 804669000
- 901494161
- 930025457
- 932076094
- 942125832
- 95270068

The list before this change can be found on Github:

- [unminified](https://github.com/TechForPalestine/palestine-datasets/blob/8f1e630f5561ca13b004b1a8bb4d75f37ad58778/killed-in-gaza.json)
- [minified](https://github.com/TechForPalestine/palestine-datasets/blob/8f1e630f5561ca13b004b1a8bb4d75f37ad58778/killed-in-gaza.min.json)

Here are some additional details about the current list & the latest revision:

- there are 14,138 names
- 92 records (0.65%) had age changes from the prior release (all 1 year less than before)
- using levenshtein distance in comparing the prior english translations to new:
  - 97.7% of names had differences of less than 10 edits
  - 1.9% of names had differences of 10 or more edits
- there are 29 names with "unknown" for part or all of the name, and those are now represented in the english translation as `?`

We're continually working to improve translations and the list in general. If you have ideas or want to contribute a change, please see our [contributing guide](/docs/guides/contributing).
