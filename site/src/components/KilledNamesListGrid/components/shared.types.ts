import { PersonType } from "../types";

export interface SharedProps {
  selectedFilters: PersonType[];
  onToggleFilter: (type: PersonType) => void;
}
