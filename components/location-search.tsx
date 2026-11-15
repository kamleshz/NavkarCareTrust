import { SearchIcon } from "@/components/icons";

interface LocationSearchProps {
  defaultValue?: string;
  compact?: boolean;
}

export function LocationSearch({
  defaultValue = "",
  compact = false,
}: LocationSearchProps) {
  return (
    <form
      className={compact ? "location-search compact" : "location-search"}
      action="/support"
      method="get"
    >
      <div className="search-field">
        <label htmlFor={compact ? "directory-location" : "home-location"}>
          City or 6-digit PIN code
        </label>
        <div className="input-with-icon">
          <SearchIcon width="22" height="22" />
          <input
            id={compact ? "directory-location" : "home-location"}
            name="location"
            type="search"
            inputMode="search"
            defaultValue={defaultValue}
            placeholder="For example, Ahmedabad or 380009"
          />
        </div>
      </div>
      <button className="button button-primary" type="submit">
        Find Support
      </button>
    </form>
  );
}
