import clsx from "clsx";
import { PersonIcon } from "../../KilledHeaderMarquee/PersonIcon";
import styles from "./GenderAgeFilters.module.css";
import { personHints, PersonIconProps, PersonType } from "../types";
import { SharedProps } from "./shared.types";
import { SearchIcon } from "../../SearchIcon";

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

interface GenderAgeFiltersProps extends SharedProps {
  onPressSearchExpand: () => void;
}

export const GenderAgeFilters = ({
  selectedFilters,
  onPressSearchExpand,
  onToggleFilter,
}: GenderAgeFiltersProps) => {
  return (
    <div className={styles.genderAgeFilters}>
      <div className={styles.filterSearchContainer}>
        <div
          onClick={onPressSearchExpand}
          title="Show name search input"
          className={clsx(styles.filterSearchButton)}
        >
          <SearchIcon size={30} />
        </div>
      </div>
      <div className={styles.genderAgeFilterRow}>
        {filterButtons.map((btn) => (
          <div
            key={btn.type}
            onClick={() => onToggleFilter(btn.type)}
            title={personHints[btn.type]}
            className={clsx(
              styles.filterButton,
              selectedFilters.includes(btn.type) && styles.filterButtonActive
            )}
          >
            <PersonIcon size={30} {...btn} />
          </div>
        ))}
      </div>
    </div>
  );
};
