// src/components/GeometryList.jsx
import React, { useState, useEffect, useCallback } from "react";
import "../styles/geometry-list.css";
import { getPagedGeometries } from "../api/geometryApi";
import debounce from "lodash/debounce";
import GeometryListTable from "./GeometryListTable.jsx"; // ✅ yeni component

export default function GeometryList({ onZoom, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useCallback(
    debounce((val) => {
      setPage(1);
      loadData(1, val);
    }, 500),
    []
  );

  const loadData = async (pageNum = 1, searchTerm = "") => {
    setLoading(true);
    try {
      const res = await getPagedGeometries({ page: pageNum, pageSize: 10, search: searchTerm });
      if (res.success) {
        setItems(res.data.items);
        setTotalPages(res.data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(page, search);
  }, [page]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  return (
    <div className="list-modal">
      {/* header */}
      <div className="list-header">
        <div className="list-title">Geometries</div>
        <button className="close-btn" onClick={onClose} title="Close">✕</button>
      </div>

      {/* search */}
      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={handleSearch}
        className="geometry-search"
      />

      {/* ✅ sadece tablo ayrı component */}
      <div className="list-scroll">
        <table className="geo-table">
          <thead>
            <tr>
              <th style={{ width: 64 }}>ID</th>
              <th style={{ width: 180 }}>Name</th>
              <th style={{ width: 120 }}>Type</th>
              <th>WKT</th>
              <th style={{ width: 50 }}></th>
            </tr>
          </thead>
          <GeometryListTable items={items} loading={loading} onZoom={onZoom} onClose={onClose} />
        </table>
      </div>

      {/* pagination */}
      <div className="pagination">
        <button
          className={`page-btn prev ${page <= 1 ? "disabled" : ""}`}
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <img src="/src/assets/icons/Ok.svg" alt="Prev" className="arrow left" />
        </button>

        <span className="page-info">Page {page} / {totalPages}</span>

        <button
          className={`page-btn next ${page >= totalPages ? "disabled" : ""}`}
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          <img src="/src/assets/icons/Ok.svg" alt="Next" className="arrow right" />
        </button>
      </div>
    </div>
  );
}
