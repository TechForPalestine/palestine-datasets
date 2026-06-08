import clsx from "clsx";
import styles from "./styles.module.css";
import { useMemo, useState } from "react";

type DatasetTag = "daily-casualties" | "killed-in-gaza";
type TypeTag =
  | "interactive"
  | "journalism"
  | "comprehending-scale"
  | "visualization"
  | "memorial"
  | "developer-tool";

export type Example = {
  image: string;
  description: string;
  link: string;
  tags?: Array<DatasetTag | TypeTag>;
};

type Props = {
  examples: Array<Example>;
};

const numberPerRow = 2;

const tagGroups = {
  dataset: {
    label: "Dataset",
    tags: {
      "daily-casualties": "Daily Casualties",
      "killed-in-gaza": "Killed in Gaza",
    } satisfies Record<DatasetTag, string>,
  },
  type: {
    label: "Type",
    tags: {
      interactive: "Interactive",
      journalism: "Journalism",
      "comprehending-scale": "Comprehending Scale",
      visualization: "Visualization",
      memorial: "Memorial",
      "developer-tool": "Developer Tool",
    } satisfies Record<TypeTag, string>,
  },
};

type TagKey = DatasetTag | TypeTag;

const linkTargetFor = (link: string) => {
  if (link.endsWith("pdf") || link.startsWith("http")) {
    return "_blank";
  }
};

export const ExampleUsageGrid = (props: Props) => {
  const showFilters = props.examples.some((example) => example.tags?.length);
  const [activeTags, setActiveTags] = useState<Set<TagKey>>(new Set());

  const toggleTag = (tag: TagKey) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setActiveTags(new Set());
  };

  const filteredExamples = useMemo(() => {
    if (!showFilters || activeTags.size === 0) return props.examples;

    const activeDatasetTags = Object.keys(tagGroups.dataset.tags).filter((t) =>
      activeTags.has(t as DatasetTag),
    );
    const activeTypeTags = Object.keys(tagGroups.type.tags).filter((t) =>
      activeTags.has(t as TypeTag),
    );

    return props.examples.filter((example) => {
      const exampleTags = example.tags ?? [];
      const matchesDataset =
        activeDatasetTags.length === 0 ||
        activeDatasetTags.some((t) => exampleTags.includes(t as DatasetTag));
      const matchesType =
        activeTypeTags.length === 0 ||
        activeTypeTags.some((t) => exampleTags.includes(t as TypeTag));
      return matchesDataset && matchesType;
    });
  }, [props.examples, activeTags, showFilters]);

  const rows = useMemo(() => {
    return filteredExamples.reduce(
      (acc, example) => {
        const newRow = Number.isInteger(acc.length / numberPerRow);
        if (newRow) {
          acc.push([example]);
        } else {
          acc[acc.length - 1].push(example);
        }
        return acc;
      },
      [] as Array<Example[]>,
    );
  }, [filteredExamples]);

  return (
    <div>
      {showFilters && (
        <div className={styles.filterContainer}>
          {Object.values(tagGroups).map((group) => (
            <div key={group.label} className={styles.filterGroup}>
              <span className={styles.filterGroupLabel}>{group.label}:</span>
              <div className={styles.filterButtons}>
                {Object.entries(group.tags).map(([tag, label]) => (
                  <button
                    key={tag}
                    className={clsx(
                      styles.filterButton,
                      activeTags.has(tag as TagKey) && styles.filterButtonActive,
                    )}
                    onClick={() => toggleTag(tag as TagKey)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {activeTags.size > 0 && (
            <button className={styles.clearButton} onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}
      {filteredExamples.length === 0 && (
        <div className={styles.noResults}>No examples match the selected filters.</div>
      )}
      {rows.map((row) => (
        <div className="row">
          {row.map((col) => (
            <div key={col.link} className={clsx("col col--6")}>
              <a href={col.link} target={linkTargetFor(col.link)}>
                <div className={styles.exampleCard}>
                  <div
                    className={styles.exampleImage}
                    style={{
                      backgroundImage: `url(${col.image})`,
                    }}
                  />
                  <div>{col.description}</div>
                </div>
              </a>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
