import clsx from "clsx";
import { CancelCircleIcon } from "../../CancelCircleIcon";
import { SearchIcon } from "../../SearchIcon";
import styles from "./FilterRow.module.css";
import { GenderAgeFilters } from "./GenderAgeFilters";
import { SharedProps } from "./shared.types";
import { useRef, useState } from "react";

interface FilterRowProps extends SharedProps {
  onSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FilterRow = ({
  selectedFilters,
  onToggleFilter,
  onSearchInputChange,
}: FilterRowProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);

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
    setSearchExpanded(false);
  };

  const onPressSearchExpand = () => {
    setSearchExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const onSearchEscape = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      handleInputClear();
    }
  };

  return (
    <div className={styles.filterRow}>
      <div
        className={clsx(
          styles.inputContainer,
          searchExpanded && styles.inputContainerActive
        )}
      >
        <div className={styles.input}>
          <input
            ref={inputRef}
            onChange={handleInputChange}
            onKeyUp={onSearchEscape}
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
              (searchValue.trim().length > 0 || searchExpanded) &&
                styles.cancelSearchIconActive
            )}
          >
            <CancelCircleIcon size={20} />
          </div>
        </div>
      </div>
      <div className={searchExpanded ? styles.hideFilters : undefined}>
        <GenderAgeFilters
          selectedFilters={selectedFilters}
          onPressSearchExpand={onPressSearchExpand}
          onToggleFilter={onToggleFilter}
        />
      </div>
    </div>
  );
};
