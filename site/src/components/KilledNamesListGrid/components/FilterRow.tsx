import clsx from "clsx";
import { CancelCircleIcon } from "../../CancelCircleIcon";
import { SearchIcon } from "../../SearchIcon";
import styles from "./FilterRow.module.css";
import { GenderAgeFilters } from "./GenderAgeFilters";
import { SharedProps } from "./shared.types";
import { useState } from "react";

interface FilterRowProps extends SharedProps {
  onSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FilterRow = ({
  selectedFilters,
  onToggleFilter,
  onSearchInputChange,
}: FilterRowProps) => {
  const [searchValue, setSearchValue] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearchInputChange(e);
  };

  const handleInputClear = () => {
    setSearchValue("");
    const event = {
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>;
    onSearchInputChange(event);
  };

  return (
    <div className={styles.filterRow}>
      <div className={styles.inputContainer}>
        <div className={styles.input}>
          <input
            onChange={handleInputChange}
            className={styles.searchInput}
            placeholder="Search names..."
            type="text"
            value={searchValue}
          />
          <div className={styles.searchIcon}>
            <SearchIcon size={24} />
          </div>
          <div
            onClick={handleInputClear}
            className={clsx(
              styles.cancelSearchIcon,
              searchValue.trim().length > 0 && styles.cancelSearchIconActive
            )}
          >
            <CancelCircleIcon size={20} />
          </div>
        </div>
      </div>
      <GenderAgeFilters
        selectedFilters={selectedFilters}
        onToggleFilter={onToggleFilter}
      />
    </div>
  );
};
