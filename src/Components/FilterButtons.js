import React from "react";

const FilterButtons = ({ filter, setFilter }) => {
  return (
    <div className="filter-container">
      <button
        className={`filter-button ${filter === "all" ? "active" : ""}`}
        onClick={() => setFilter("all")}
      >
        전체
      </button>
      <button
        className={`filter-button ${filter === "active" ? "active" : ""}`}
        onClick={() => setFilter("active")}
      >
        미완료
      </button>
      <button
        className={`filter-button ${filter === "completed" ? "active" : ""}`}
        onClick={() => setFilter("completed")}
      >
        완료
      </button>
      <button
        className={`filter-button ${filter === "mine" ? "active" : ""}`}
        onClick={() => setFilter("mine")}
      >
        내가
      </button>
      <button
        className={`filter-button ${filter === "partner" ? "active" : ""}`}
        onClick={() => setFilter("partner")}
      >
        상대방
      </button>
      <button
        className={`filter-button ${filter === "both" ? "active" : ""}`}
        onClick={() => setFilter("both")}
      >
        둘 다
      </button>
    </div>
  );
};

export default FilterButtons;