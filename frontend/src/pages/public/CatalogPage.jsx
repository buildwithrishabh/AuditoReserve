import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { getAllAuditoriums } from "../../api/auditoriums";
import { SkeletonGrid } from "../../components/common/LoadingSkeleton";
import { ErrorState, EmptyState } from "../../components/common/ErrorState";
import { AuditoriumCard } from "../../components/auditoriums/AuditoriumCard";
import { staggerContainerFast, cardItem } from "../../lib/animations";

export function CatalogPage() {
  const [query, setQuery] = useState("");

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["auditoriums"],
    queryFn: getAllAuditoriums,
  });

  const filteredAuditoriums = useMemo(() => {
    return data.filter((auditorium) => {
      return auditorium.name.toLowerCase().includes(query.toLowerCase());
    });
  }, [data, query]);

  return (
    <section>
      <div className="section-heading">
        <div className="page-header" style={{ margin: 0 }}>
          <p className="eyebrow">Campus venues</p>
          <h1 style={{ margin: 0 }}>Find an auditorium</h1>
          <p style={{ margin: "6px 0 0" }}>
            Browse available campus venues and submit booking requests for your events.
          </p>
        </div>
        <div className="search-field" style={{ minWidth: "300px", maxWidth: "420px", flex: "1 1 auto" }}>
          <Search size={18} style={{ color: "var(--text-muted)" }} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search venue by name..."
            aria-label="Search venues"
          />
        </div>
      </div>

      {isLoading && <SkeletonGrid />}

      {isError && (
        <ErrorState
          title="Could not load auditoriums"
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && filteredAuditoriums.length === 0 && (
        <EmptyState
          title="No auditoriums found"
          message="Try changing your search keywords."
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
    </section>
  );
}

export default CatalogPage;
