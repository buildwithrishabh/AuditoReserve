import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUpDown, Building2, Search, SlidersHorizontal, X } from "lucide-react";
import { getAllAuditoriums } from "../../api/auditoriums";
import { SkeletonGrid } from "../../components/common/LoadingSkeleton";
import { ErrorState, EmptyState } from "../../components/common/ErrorState";
import { AuditoriumCard } from "../../components/auditoriums/AuditoriumCard";
import { staggerContainerFast, cardItem } from "../../lib/animations";

export function CatalogPage() {
  const [query, setQuery] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [showFilters, setShowFilters] = useState(false);

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["auditoriums"],
    queryFn: getAllAuditoriums,
  });

  const hasActiveFilters = Boolean(query || minCapacity || maxPrice);

  const handleResetFilters = () => {
    setQuery("");
    setMinCapacity("");
    setMaxPrice("");
    setSortBy("name");
  };

  const filteredAuditoriums = useMemo(() => {
    let result = data.filter((auditorium) => {
      const matchesName = auditorium.name.toLowerCase().includes(query.toLowerCase()) ||
        auditorium.description?.toLowerCase().includes(query.toLowerCase()) ||
        auditorium.amenities?.some((a) => a.toLowerCase().includes(query.toLowerCase()));

      const matchesCapacity = !minCapacity || Number(auditorium.capacity) >= Number(minCapacity);
      const matchesPrice = !maxPrice || Number(auditorium.basePrice) <= Number(maxPrice);

      return matchesName && matchesCapacity && matchesPrice;
    });

    result.sort((a, b) => {
      if (sortBy === "capacity-desc") return b.capacity - a.capacity;
      if (sortBy === "price-asc") return a.basePrice - b.basePrice;
      if (sortBy === "price-desc") return b.basePrice - a.basePrice;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [data, query, minCapacity, maxPrice, sortBy]);

  return (
    <div className="catalog-page">
      {/* Catalog Header Banner */}
      <div className="catalog-header-band">
        <div className="catalog-header-content">
          <span className="eyebrow">
            <Building2 size={13} aria-hidden="true" />
            Campus Venues Directory
          </span>
          <h1>University Auditoriums</h1>
          <p className="lead">
            Discover and reserve university auditoriums, conference theatres, and multipurpose event halls.
          </p>
        </div>
        <div className="catalog-venue-count">
          <strong className="tabular-nums">{data.length}</strong>
          <span>Total Venues</span>
        </div>
      </div>

      {/* Catalog Toolbar Card */}
      <div className="catalog-toolbar card">
        <div className="toolbar-main-row">
          <div className="search-field catalog-search">
            <Search size={18} className="search-icon" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by venue name, amenities, or features..."
              aria-label="Search venues"
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setQuery("")}
                aria-label="Clear search query"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="toolbar-controls-group">
            <div className="sort-control">
              <ArrowUpDown size={15} className="sort-icon" aria-hidden="true" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
                aria-label="Sort auditoriums by"
              >
                <option value="name">Sort by Name (A-Z)</option>
                <option value="capacity-desc">Capacity (High to Low)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
              </select>
            </div>

            <button
              type="button"
              className={`button ghost sm filter-toggle-btn ${showFilters || hasActiveFilters ? "active" : ""}`}
              onClick={() => setShowFilters((prev) => !prev)}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal size={15} />
              <span>Filters</span>
              {hasActiveFilters && <span className="filter-active-dot" />}
            </button>
          </div>
        </div>

        {/* Collapsible Filter Row */}
        {showFilters && (
          <div className="toolbar-filter-drawer">
            <div className="filter-input-group">
              <label htmlFor="min-capacity-filter">Minimum Seats</label>
              <input
                id="min-capacity-filter"
                className="control"
                type="number"
                min="0"
                placeholder="e.g. 200"
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
              />
            </div>
            <div className="filter-input-group">
              <label htmlFor="max-price-filter">Max Rate (&#8377;/hr)</label>
              <input
                id="max-price-filter"
                className="control"
                type="number"
                min="0"
                placeholder="e.g. 5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            {hasActiveFilters && (
              <div className="filter-actions">
                <button
                  type="button"
                  className="button ghost sm reset-filters-btn"
                  onClick={handleResetFilters}
                >
                  <X size={14} /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results summary row */}
        <div className="toolbar-status-row">
          <span className="results-count">
            Showing <strong className="tabular-nums">{filteredAuditoriums.length}</strong> of{" "}
            <strong className="tabular-nums">{data.length}</strong> auditoriums
          </span>

          {hasActiveFilters && (
            <div className="active-chips">
              {query && (
                <span className="filter-chip">
                  Keyword: &quot;{query}&quot;
                  <button type="button" onClick={() => setQuery("")} aria-label="Remove keyword filter">
                    &times;
                  </button>
                </span>
              )}
              {minCapacity && (
                <span className="filter-chip">
                  &ge; {minCapacity} seats
                  <button type="button" onClick={() => setMinCapacity("")} aria-label="Remove capacity filter">
                    &times;
                  </button>
                </span>
              )}
              {maxPrice && (
                <span className="filter-chip">
                  &le; &#8377;{maxPrice}/hr
                  <button type="button" onClick={() => setMaxPrice("")} aria-label="Remove price filter">
                    &times;
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid Content States */}
      {isLoading && <SkeletonGrid />}

      {isError && (
        <ErrorState
          title="Could not load auditoriums"
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && filteredAuditoriums.length === 0 && (
        <EmptyState
          title="No auditoriums match your criteria"
          message="Try adjusting or clearing your filters to see available campus venues."
          action={
            hasActiveFilters ? (
              <button
                type="button"
                className="button primary sm"
                style={{ marginTop: "16px" }}
                onClick={handleResetFilters}
              >
                Clear all filters
              </button>
            ) : null
          }
        />
      )}

      {!isLoading && !isError && filteredAuditoriums.length > 0 && (
        <motion.div
          className="auditorium-grid"
          variants={staggerContainerFast}
          initial="hidden"
          animate="visible"
        >
          {filteredAuditoriums.map((auditorium) => (
            <motion.div key={auditorium._id} variants={cardItem}>
              <AuditoriumCard auditorium={auditorium} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default CatalogPage;
