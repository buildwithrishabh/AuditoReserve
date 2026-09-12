import { Search } from "lucide-react";

export function AuditoriumFilters({
  query,
  setQuery,
  capacity,
  setCapacity,
  price,
  setPrice,
  onReset,
}) {
  return (
    <div className="toolbar">
      <div className="search-field">
        <Search size={18} style={{ color: "var(--text-muted)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search venues by name, description, amenities..."
          aria-label="Search venues"
        />
      </div>
      
      <input
        className="control"
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        type="number"
        min="0"
        placeholder="Min capacity (seats)"
        aria-label="Minimum capacity"
      />
      
      <input
        className="control"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        type="number"
        min="0"
        placeholder="Max price per hour"
        aria-label="Maximum price per hour"
      />
      
      <button
        className="button ghost"
        type="button"
        onClick={onReset}
        style={{ minWidth: "90px" }}
      >
        Reset
      </button>
    </div>
  );
}
export default AuditoriumFilters;
