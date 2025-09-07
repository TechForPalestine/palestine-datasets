import clsx from "clsx";
import { PersonIcon } from "../../KilledHeaderMarquee/PersonIcon";
import styles from "./GenderAgeFilters.module.css";
import { personHints, PersonIconProps, PersonType } from "../types";

const filterButtons: PersonIconProps[] = [
  {
    type: "elderly-woman",
  },
  {
    type: "elderly-man",
  },
  {
    type: "woman",
  },
  {
    type: "man",
  },
  {
    type: "girl",
  },
  {
    type: "boy",
  },
];

interface SharedProps {
  selectedFilters: PersonType[];
  onToggleFilter: (type: PersonType) => void;
}

const GenderAgeFilters = ({ selectedFilters, onToggleFilter }: SharedProps) => {
  return (
    <div className={styles.genderAgeFilters}>
      <div className={styles.genderAgeFilterRow}>
        {filterButtons.slice(0, 3).map((btn) => (
          <div
            onClick={() => onToggleFilter(btn.type)}
            title={personHints[btn.type]}
            className={clsx(
              styles.filterButton,
              selectedFilters.includes(btn.type) && styles.filterButtonActive
            )}
          >
            <PersonIcon {...btn} />
          </div>
        ))}
      </div>
      <div className={styles.genderAgeFilterRow}>
        {filterButtons.slice(3, 6).map((btn) => (
          <div
            onClick={() => onToggleFilter(btn.type)}
            title={personHints[btn.type]}
            className={clsx(
              styles.filterButton,
              selectedFilters.includes(btn.type) && styles.filterButtonActive
            )}
          >
            <PersonIcon {...btn} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const FilterRow = ({ selectedFilters, onToggleFilter }: SharedProps) => {
  return (
    <div className={styles.filterRow}>
      <GenderAgeFilters
        selectedFilters={selectedFilters}
        onToggleFilter={onToggleFilter}
      />
    </div>
  );
};
