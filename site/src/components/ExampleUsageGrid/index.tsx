import clsx from "clsx";
import styles from "./styles.module.css";
import { useMemo } from "react";

type Props = {
  examples: Array<{ image: string; description: string; link: string }>;
};

const numberPerRow = 2;

export const ExampleUsageGrid = (props: Props) => {
  const rows = useMemo(() => {
    return props.examples.reduce((acc, example) => {
      const newRow = Number.isInteger(acc.length / numberPerRow);
      if (newRow) {
        acc.push([example]);
      } else {
        acc[acc.length - 1].push(example);
      }
      return acc;
    }, [] as Array<Props["examples"]>);
  }, [props.examples]);

  return (
    <div>
      {rows.map((row) => (
        <div className="row">
          {row.map((col) => (
            <div key={col.link} className={clsx("col col--6")}>
              <a href={col.link} target="_blank">
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
