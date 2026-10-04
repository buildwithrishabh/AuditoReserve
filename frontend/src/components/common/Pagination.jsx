import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Pagination.css";

export function Pagination({
  page = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 10,
  onPageChange,
  isLoading = false,
}) {
  if (totalPages <= 1) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      if (page <= 3) {
        start = 2;
        end = 4;
      } else if (page >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="pagination-container" aria-label="Pagination Navigation">
      <div className="pagination-meta">
        Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalItems}</strong> entries
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn pagination-nav-btn"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </button>

        <div className="pagination-pages">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                  &hellip;
                </span>
              );
            }

            const isActive = p === page;
            return (
              <button
                key={p}
                type="button"
                className={`pagination-btn pagination-num-btn ${isActive ? "active" : ""}`}
                disabled={isLoading}
                onClick={() => onPageChange(p)}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Page ${p}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="pagination-btn pagination-nav-btn"
          disabled={page >= totalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
