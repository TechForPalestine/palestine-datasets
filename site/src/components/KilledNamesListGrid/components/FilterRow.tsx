import { SearchIcon } from "../../SearchIcon";
import styles from "./FilterRow.module.css";
import { GenderAgeFilters } from "./GenderAgeFilters";
import { SharedProps } from "./shared.types";

interface FilterRowProps extends SharedProps {
  onSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FilterRow = ({
  selectedFilters,
  onToggleFilter,
  onSearchInputChange,
}: FilterRowProps) => {
  return (
    <div className={styles.filterRow}>
      <div className={styles.inputContainer}>
        <input
          onChange={onSearchInputChange}
          className={styles.searchInput}
          placeholder="Search names..."
          type="text"
        />
        <SearchIcon size={24} />
      </div>
      <GenderAgeFilters
        selectedFilters={selectedFilters}
        onToggleFilter={onToggleFilter}
      />
    </div>
  );
};
