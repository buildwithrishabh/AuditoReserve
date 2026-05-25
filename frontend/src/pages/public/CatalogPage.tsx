import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getAllAuditoriums } from "../../api/auditoriums";
import { SkeletonGrid } from "../../components/common/LoadingSkeleton";
import { ErrorState, EmptyState } from "../../components/common/ErrorState";
import { AuditoriumCard } from "../../components/auditoriums/AuditoriumCard";
import { AuditoriumFilters } from "../../components/auditoriums/AuditoriumFilters";
import { staggerContainerFast, cardItem } from "../../lib/animations";

export function CatalogPage() {
  const [query, setQuery] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");

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
      const searchText =
        `${auditorium.name} ${auditorium.description} ${auditorium.amenities.join(" ")}`.toLowerCase();
      const matchesQuery = searchText.includes(query.toLowerCase());
      const matchesCapacity = capacity
        ? auditorium.capacity >= Number(capacity)
        : true;
      const matchesPrice = price
        ? auditorium.basePrice <= Number(price)
        : true;
      return matchesQuery && matchesCapacity && matchesPrice;
    });
  }, [capacity, data, price, query]);

  const handleReset = () => {
    setQuery("");
    setCapacity("");
    setPrice("");
  };

  return (
    <section>
      <div className="page-header">
        <p className="eyebrow">Campus venues</p>
        <h1>Find an auditorium</h1>
        <p>
          Browse available campus venues and submit booking requests for your
          events.
        </p>
      </div>

      <AuditoriumFilters
        query={query}
        setQuery={setQuery}
        capacity={capacity}
        setCapacity={setCapacity}
        price={price}
        setPrice={setPrice}
        onReset={handleReset}
      />

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
