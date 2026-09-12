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
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "flex-end", 
          flexWrap: "wrap", 
          gap: "24px", 
          marginBottom: "36px" 
        }}
      >
        <div style={{ flex: "1 1 300px" }}>
          <p className="eyebrow" style={{ margin: "0 0 6px" }}>Campus venues</p>
          <h1 style={{ margin: 0, fontSize: "32px", fontWeight: 800 }}>Find an auditorium</h1>
          <p style={{ margin: "8px 0 0", color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.5" }}>
            Browse available campus venues and submit booking requests for your events.
          </p>
        </div>
        <div className="search-field" style={{ minWidth: "320px", maxWidth: "400px", flex: "1 1 auto" }}>
          <Search size={18} style={{ color: "var(--text-muted)" }} />
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
          message="Try changing your filters or search terms."
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
