import React, { useState } from "react";
import { ArrowUpRight, Search, Upload } from "lucide-react";
import { rooms } from "./visualizerEngine.mjs";
const categories = [
  "All rooms",
  "Living room",
  "Kitchen",
  "Bathroom",
  "Bedroom",
  "Outdoor",
  "Pool",
];
export default function RoomLibrary({ onChoose, onUpload, uploading }) {
  const [category, setCategory] = useState("All rooms");
  const [query, setQuery] = useState("");
  const filtered = rooms.filter(
    (r) =>
      (category === "All rooms" || r.category === category) &&
      `${r.name} ${r.style} ${r.category}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <section className="tv-library" aria-label="Room library">
      <div className="tv-library-intro">
        <div>
          <span className="tv-eyebrow">TRUBUILD / ROOM LIBRARY</span>
          <h1>
            Start with a space.
            <br />
            Make it yours.
          </h1>
          <p>
            Explore tiles and grout in {rooms.length} ready-to-style rooms, or
            try your own photo.
          </p>
        </div>
        <button
          className="tv-library-upload"
          onClick={onUpload}
          disabled={uploading}
        >
          <Upload size={24} />
          <strong>{uploading ? "Opening photo…" : "Use your own room"}</strong>
          <span>JPG, PNG or WebP · stays on your device</span>
        </button>
      </div>
      <div className="tv-library-tools">
        <div className="tv-categories" aria-label="Room categories">
          {categories.map((c) => (
            <button
              key={c}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
              <span>
                {c === "All rooms"
                  ? rooms.length
                  : rooms.filter((r) => r.category === c).length}
              </span>
            </button>
          ))}
        </div>
        <label className="tv-room-search">
          <Search size={18} />
          <input
            aria-label="Search rooms"
            placeholder="Find your space"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="tv-library-count" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "room" : "rooms"} · Select a
        scene to begin
      </div>
      <div className="tv-room-grid">
        {filtered.map((r) => (
          <button
            key={r.id}
            className="tv-room-card"
            onClick={() => onChoose(r.id)}
            aria-label={`Style ${r.name}`}
          >
            <div className="tv-room-photo">
              <img src={r.image} alt={r.name} loading="lazy" />
              <span>{r.category}</span>
              <i>
                <ArrowUpRight size={23} />
              </i>
            </div>
            <div className="tv-room-caption">
              <div>
                <h2>{r.name}</h2>
                <p>{r.style}</p>
              </div>
              <span>
                {[r.floor, r.wall, r.wall2].filter(Boolean).length} surfaces
              </span>
            </div>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <div className="tv-room-empty">
          <h2>No rooms match your search.</h2>
          <button
            onClick={() => {
              setQuery("");
              setCategory("All rooms");
            }}
          >
            Show all rooms
          </button>
        </div>
      )}
      <p className="tv-library-footnote">
        Illustrative room scenes. Pool shown without water so you can inspect
        the finishes. Confirm product suitability for each application.
      </p>
    </section>
  );
}
