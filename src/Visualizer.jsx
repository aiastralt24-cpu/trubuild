import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Columns2,
  Download,
  Grid2X2,
  Layers,
  RotateCcw,
  Upload,
  X,
  Move,
  ChevronDown,
  Undo2,
  Redo2,
  BookmarkPlus,
  Share2,
  ZoomIn,
} from "lucide-react";
import {
  defaultFinish,
  materials,
  renderRoom,
  rooms,
  shades,
  validQuad,
  layouts,
  surfaceKeys,
} from "./visualizerEngine.mjs";
import "./visualizer.css";
import RoomLibrary from "./RoomLibrary";
import { useFinishHistory } from "./useFinishHistory";
import {
  STORAGE_KEY,
  cleanDesign,
  cleanFinishes,
  tileEstimate,
  tileDimensions,
  finishPresets,
} from "./visualizerState.mjs";

export default function Visualizer() {
  const [browsing, setBrowsing] = useState(true);
  const [previewInView, setPreviewInView] = useState(true);
  const [roomId, setRoomId] = useState("living");
  const [uploaded, setUploaded] = useState(null);
  const [surface, setSurface] = useState("floor");
  const [finishes, setFinishes, undo, redo, canUndo, canRedo] =
    useFinishHistory({
      floor: defaultFinish(),
      wall: null,
    });
  const [saved, setSaved] = useState([]);
  const [designName, setDesignName] = useState("");
  const [baselineId, setBaselineId] = useState("original");
  const [restored, setRestored] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState(""),
    [waste, setWaste] = useState("10");
  const [shareLink, setShareLink] = useState("");
  const [compare, setCompare] = useState(false),
    [split, setSplit] = useState(50);
  const [photo, setPhoto] = useState(null),
    [error, setError] = useState(""),
    [status, setStatus] = useState("");
  const [busy, setBusy] = useState(true),
    [selecting, setSelecting] = useState(false),
    [points, setPoints] = useState([]);
  const [uploading, setUploading] = useState(false);
  const canvas = useRef(null),
    original = useRef(null),
    file = useRef(null),
    scene = useRef(null);
  const uploadSequence = useRef(0);
  const draggedCorner = useRef(null);
  useEffect(() => {
    if (browsing || !scene.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPreviewInView(entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(scene.current);
    return () => observer.disconnect();
  }, [browsing, photo]);
  useEffect(() => {
    setShareLink("");
  }, [roomId, finishes]);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const safeSaved = Array.isArray(stored.saved)
        ? stored.saved.slice(0, 6).flatMap((item, i) => {
            const design = cleanDesign(item);
            return design
              ? [
                  {
                    ...design,
                    id: `saved-${i}`,
                    name: String(item.name || `Design ${i + 1}`).slice(0, 40),
                  },
                ]
              : [];
          })
        : [];
      setSaved(safeSaved);
      const encoded = new URLSearchParams(window.location.search).get("design");
      const draft = cleanDesign(encoded ? JSON.parse(encoded) : stored.draft);
      if (encoded && draft) setBrowsing(false);
      if (draft) {
        setRoomId(draft.roomId);
        setFinishes(draft.finishes);
      }
    } catch {
      /* Storage can be unavailable or a shared link malformed. */
    }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          saved: saved.filter((d) => d.roomId !== "upload"),
          draft: roomId === "upload" ? null : { roomId, finishes },
        }),
      );
    } catch {
      /* The studio remains usable without persistence. */
    }
  }, [restored, saved, finishes, roomId]);
  const room =
    roomId === "upload" && uploaded
      ? uploaded
      : rooms.find((r) => r.id === roomId) || rooms[0];
  const finish = finishes[surface] || defaultFinish();
  const availableSaved = saved.filter(
    (d) =>
      d.roomId === roomId && (roomId !== "upload" || d.photo === room.image),
  );
  const baseline = availableSaved.find((d) => d.id === baselineId);
  const estimate = tileEstimate(
    Number(area),
    finish.size,
    Number(waste),
    finish.layout,
  );
  const dimensions = tileDimensions(finish.size, finish.layout);
  function saveDesign() {
    if (saved.length >= 6) {
      setError("You can keep six designs. Remove one to make room.");
      return;
    }
    const design = {
      id: crypto.randomUUID(),
      name: designName.trim().slice(0, 40) || `Design ${saved.length + 1}`,
      roomId,
      finishes: cleanFinishes(finishes),
    };
    if (roomId === "upload") {
      design.photo = room.image;
      design.geometry = { floor: room.floor, wall: room.wall };
    }
    setSaved((prev) => [...prev, design]);
    setDesignName("");
    setStatus(
      roomId === "upload"
        ? "Design saved for this visit. Uploaded photos are not stored."
        : "Design saved on this device.",
    );
  }
  function restoreDesign(design) {
    if (design.roomId === "upload" && uploaded?.image !== design.photo) return;
    chooseRoom(design.roomId);
    if (design.geometry)
      setUploaded((prev) => ({ ...prev, ...design.geometry }));
    setFinishes(cleanFinishes(design.finishes));
    setStatus(`${design.name} restored.`);
  }
  async function shareDesign() {
    const url = new URL("/visualizer", window.location.origin);
    url.searchParams.set("design", JSON.stringify({ roomId, finishes }));
    setShareLink(url.href);
    try {
      await navigator.clipboard.writeText(url.href);
      setStatus(
        "Design link copied. It opens this demo room and all selected finishes.",
      );
    } catch {
      setStatus("Your design link is ready. Select it below to copy.");
    }
  }
  function moveCorner(event) {
    const i = draggedCorner.current;
    if (i === null) return;
    const box = scene.current.getBoundingClientRect();
    const point = [
      Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)),
      Math.max(0, Math.min(1, (event.clientY - box.top) / box.height)),
    ];
    setPoints((prev) => prev.map((p, index) => (index === i ? point : p)));
  }
  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    setPhoto(null);
    setError("");
    const img = new Image();
    img.onload = () => {
      if (!cancelled) {
        setPhoto(img);
        setBusy(false);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setError(
          "This room could not load. Please choose another room or try again.",
        );
        setBusy(false);
      }
    };
    img.src = room.image;
    return () => {
      cancelled = true;
    };
  }, [room.image]);
  useEffect(() => {
    if (browsing || !photo || !canvas.current) return;
    // Render to the actual display scale rather than an oversized fixed bitmap.
    const w = Math.min(
        1400,
        photo.naturalWidth,
        Math.max(
          800,
          Math.round(
            (scene.current?.clientWidth || 900) *
              Math.min(window.devicePixelRatio || 1, 1.5),
          ),
        ),
      ),
      h = Math.round((w * photo.naturalHeight) / photo.naturalWidth);
    const frame = requestAnimationFrame(() => {
      if (canvas.current.width !== w || canvas.current.height !== h) {
        canvas.current.width = w;
        canvas.current.height = h;
      }
      const start = performance.now();
      renderRoom(canvas.current, photo, room, finishes);
      canvas.current.dataset.renderMs = (performance.now() - start).toFixed(1);
    });
    return () => cancelAnimationFrame(frame);
  }, [photo, room, finishes, browsing]);
  useEffect(() => {
    if (browsing || !photo || !original.current) return;
    original.current.width = Math.min(1400, photo.naturalWidth);
    original.current.height = Math.round(
      (original.current.width * photo.naturalHeight) / photo.naturalWidth,
    );
    if (baseline)
      renderRoom(
        original.current,
        photo,
        baseline.geometry ? { ...room, ...baseline.geometry } : room,
        baseline.finishes,
      );
    else
      original.current
        .getContext("2d")
        .drawImage(
          photo,
          0,
          0,
          original.current.width,
          original.current.height,
        );
  }, [photo, room, baseline, browsing]);
  useEffect(
    () => () => {
      uploadSequence.current++;
    },
    [],
  );
  function update(patch) {
    setFinishes((prev) => ({
      ...prev,
      [surface]: { ...(prev[surface] || defaultFinish()), ...patch },
    }));
    setStatus("");
  }
  function chooseRoom(id) {
    setBrowsing(false);
    setRoomId(id);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
    setBaselineId("original");
    setZoom(1);
    setShareLink("");
    setCompare(false);
    setSelecting(false);
    setPoints([]);
    setStatus("");
    setSurface("floor");
  }
  function selectSurface(value) {
    setSurface(value);
    setZoom(1);
    setSelecting(false);
    setPoints([]);
    if (roomId === "upload" && !room[value]) {
      setSelecting(true);
    } else if (!finishes[value])
      setFinishes((prev) => ({ ...prev, [value]: defaultFinish() }));
  }
  function reset() {
    setFinishes({ floor: defaultFinish(), wall: null });
    setSurface("floor");
    setCompare(false);
    setStatus("Finishes reset.");
  }
  async function upload(event) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setError("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (selected.size > 15 * 1024 * 1024) {
      setError("Please choose a photo smaller than 15 MB.");
      return;
    }
    const token = ++uploadSequence.current;
    setUploading(true);
    setError("");
    const url = URL.createObjectURL(selected);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      if (img.naturalWidth < 100 || img.naturalHeight < 100)
        throw new Error("Please use a photo at least 100 × 100 pixels.");
      const buffer = document.createElement("canvas");
      const scale = Math.min(
        1,
        1800 / Math.max(img.naturalWidth, img.naturalHeight),
      );
      buffer.width = Math.round(img.naturalWidth * scale);
      buffer.height = Math.round(img.naturalHeight * scale);
      buffer.getContext("2d").drawImage(img, 0, 0, buffer.width, buffer.height);
      if (token !== uploadSequence.current) return;
      setSaved((prev) => prev.filter((d) => d.roomId !== "upload"));
      setBaselineId("original");
      setZoom(1);
      setUploaded({
        id: "upload",
        name: "Your room",
        image: buffer.toDataURL("image/jpeg", 0.92),
      });
      setBrowsing(false);
      setRoomId("upload");
      setSurface("floor");
      setCompare(false);
      setPoints([]);
      setSelecting(true);
      setStatus("Photo opened locally. Select four corners of your floor.");
    } catch (e) {
      if (token === uploadSequence.current)
        setError(
          e.message === "Please use a photo at least 100 × 100 pixels."
            ? e.message
            : "We couldn’t read this photo. Try a different JPG, PNG or WebP.",
        );
    } finally {
      URL.revokeObjectURL(url);
      if (token === uploadSequence.current) setUploading(false);
    }
  }
  function addPoint(event) {
    if (
      !selecting ||
      points.length === 4 ||
      event.target.closest(".tv-corner-handle")
    )
      return;
    const box = scene.current.getBoundingClientRect();
    setPoints((prev) => [
      ...prev,
      [
        Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)),
        Math.max(0, Math.min(1, (event.clientY - box.top) / box.height)),
      ],
    ]);
  }
  function applySurface() {
    if (!validQuad(points)) {
      setError(
        "Select four corners around the surface in order, without crossing the edges.",
      );
      return;
    }
    setUploaded((prev) => ({
      ...prev,
      [surface]: { quad: points, cols: 5, rows: 5 },
    }));
    setFinishes((prev) => ({
      ...prev,
      [surface]: prev[surface] || defaultFinish(),
    }));
    setSelecting(false);
    setPoints([]);
    setError("");
    setStatus("Surface applied. Adjust the finish to explore your room.");
  }
  function download() {
    if (!photo || !canvas.current) return;
    try {
      const output = document.createElement("canvas");
      output.width = Math.min(1800, photo.naturalWidth);
      const imageHeight = Math.round(
        (canvas.current.height * output.width) / canvas.current.width,
      );
      output.height = imageHeight + 158;
      const ctx = output.getContext("2d");
      const fullResolution = document.createElement("canvas");
      fullResolution.width = output.width;
      fullResolution.height = imageHeight;
      renderRoom(fullResolution, photo, room, finishes);
      ctx.drawImage(fullResolution, 0, 0);
      ctx.fillStyle = "#f8f8f4";
      ctx.fillRect(0, imageHeight, output.width, 158);
      ctx.fillStyle = "#202624";
      ctx.font = "bold 20px Arial";
      ctx.fillText("TruBuild | Tile & grout studio", 24, imageHeight + 32);
      ctx.font = "14px Arial";
      const details = surfaceKeys
        .filter((s) => finishes[s] && room[s])
        .map(
          (s) =>
            `${room[s]?.label || s}: ${shades[finishes[s].shade][0]} / ${finishes[s].width} mm / ${finishes[s].material} / ${finishes[s].layout} / ${tileDimensions(finishes[s].size, finishes[s].layout).join(" x ")} mm / ${finishes[s].rotation || 0} deg`,
        );
      details.forEach((line, index) =>
        ctx.fillText(line, 24, imageHeight + 59 + index * 22),
      );
      ctx.fillText(
        "Illustrative preview. Confirm colours, joint widths and suitability with product data and physical samples.",
        24,
        imageHeight + 142,
      );
      output.toBlob((blob) => {
        if (!blob) {
          setError("Download failed. Please try again.");
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "trubuild-room-preview.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setStatus("PNG download started. Check your browser’s downloads.");
      }, "image/png");
    } catch {
      setError("Download failed. Please try again.");
    }
  }
  const summary = [
    "TruBuild visualizer — illustrative finish selection.",
    `Room: ${room.name}.`,
    ...surfaceKeys
      .filter((s) => finishes[s] && room[s])
      .map(
        (s) =>
          `${room[s]?.label || s}: ${shades[finishes[s].shade][0]}, ${finishes[s].width} mm joints, ${finishes[s].material}, ${tileDimensions(finishes[s].size, finishes[s].layout).join(" × ")} mm, ${finishes[s].layout} layout, ${finishes[s].rotation || 0}° rotation.`,
      ),
    ...(estimate
      ? [
          `Planning ${area} m² with ${waste}% allowance: approximately ${estimate.count} tiles at ${dimensions.join(" × ")} mm for the ${room[surface]?.label || surface}. Confirm layout and cuts on site.`,
        ]
      : []),
    "Please confirm available shades and product suitability.",
  ].join("\n");
  const enquiry =
    "/contact?" +
    new URLSearchParams({ type: "Product enquiry", requirements: summary });
  return (
    <div className="tv-studio">
      <header className="tv-header">
        <Link to="/" aria-label="TruBuild home">
          <img src="/images/wordmark-clean.webp" alt="TruBuild" />
        </Link>
        <span>Tile & grout studio</span>
        <Link to="/solutions/tiling" aria-label="Back to website">
          <ArrowLeft size={16} />
          <span>Back to website</span>
        </Link>
      </header>
      <div className="tv-content">
        {browsing && (
          <RoomLibrary
            onChoose={chooseRoom}
            onUpload={() => file.current.click()}
            uploading={uploading}
          />
        )}
        <div className="tv-editor" hidden={browsing}>
          <button className="tv-back-library" onClick={() => setBrowsing(true)}>
            <ArrowLeft size={16} /> Browse all {rooms.length} rooms
          </button>
          <div className="tv-heading">
            <div>
              <h1>{room.name}</h1>
              <p>
                Choose a surface, explore a finish, compare your favourites.
              </p>
            </div>
            <div className="tv-history">
              <button
                onClick={undo}
                disabled={!canUndo}
                aria-label="Undo finish change"
              >
                <Undo2 size={17} />
                Undo
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                aria-label="Redo finish change"
              >
                <Redo2 size={17} />
                Redo
              </button>
              <button className="tv-reset" onClick={reset}>
                <RotateCcw size={15} />
                Reset finishes
              </button>
            </div>
          </div>
          <div className="tv-workspace">
            <section className="tv-preview" aria-label="Room visualizer">
              <div className="tv-toolbar">
                <label className="tv-room-select">
                  <select
                    aria-label="Choose a room"
                    value={roomId}
                    onChange={(e) => chooseRoom(e.target.value)}
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                    {uploaded && <option value="upload">Your room</option>}
                  </select>
                  <ChevronDown size={15} />
                </label>
                <div>
                  <button
                    aria-pressed={compare}
                    disabled={!photo || selecting}
                    onClick={() => setCompare(!compare)}
                  >
                    <Columns2 size={17} />
                    Compare
                  </button>
                  <button disabled={!photo || selecting} onClick={download}>
                    <Download size={17} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              <div className="tv-tools-row">
                <label>
                  Compare with
                  <select
                    aria-label="Comparison reference"
                    value={baseline ? baseline.id : "original"}
                    onChange={(e) => {
                      setBaselineId(e.target.value);
                      setCompare(true);
                    }}
                  >
                    <option value="original">Original room</option>
                    {availableSaved.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  disabled={selecting || !photo}
                  aria-pressed={zoom === 2}
                  onClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
                >
                  <ZoomIn size={15} />
                  {zoom === 1 ? "Zoom detail" : "Fit room"}
                </button>
                <button
                  onClick={shareDesign}
                  disabled={roomId === "upload" || !photo}
                  title={
                    roomId === "upload"
                      ? "Personal photos stay private; download your preview instead."
                      : "Copy a link to this design"
                  }
                >
                  <Share2 size={15} />
                  Share design
                </button>
              </div>
              {shareLink && (
                <label className="tv-share-link">
                  Design link
                  <input
                    readOnly
                    value={shareLink}
                    onFocus={(e) => e.target.select()}
                  />
                </label>
              )}
              <div
                className={`tv-scene${selecting ? " is-selecting" : ""}`}
                ref={scene}
                style={{
                  aspectRatio: photo
                    ? `${photo.naturalWidth} / ${photo.naturalHeight}`
                    : "16 / 10",
                }}
                onClick={addPoint}
              >
                <canvas
                  ref={canvas}
                  style={{ transform: `scale(${zoom})` }}
                  aria-label={`${room.name} with your selected tile and grout finishes`}
                  role="img"
                />
                <canvas
                  ref={original}
                  className="tv-before"
                  style={{
                    transform: `scale(${zoom})`,
                    clipPath: `inset(0 ${50 + (50 - split) / zoom}% 0 0)`,
                    visibility: compare ? "visible" : "hidden",
                  }}
                  aria-label={baseline ? baseline.name : "Original room"}
                  role="img"
                />
                {busy && (
                  <div className="tv-loading" role="status">
                    <span />
                    Preparing your room…
                  </div>
                )}
                {compare && (
                  <>
                    <span className="tv-image-label tv-original-label">
                      {baseline ? baseline.name : "Original"}
                    </span>
                    <span className="tv-image-label tv-finish-label">
                      Your finish
                    </span>
                    <div className="tv-divider" style={{ left: `${split}%` }}>
                      <span>
                        <Columns2 size={19} />
                      </span>
                    </div>
                    <input
                      className="tv-compare-range"
                      type="range"
                      min="0"
                      max="100"
                      value={split}
                      onChange={(e) => setSplit(Number(e.target.value))}
                      aria-label="Before and after comparison position"
                    />
                  </>
                )}
                {selecting && (
                  <>
                    <svg
                      className="tv-selection"
                      viewBox="0 0 1000 1000"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <polygon
                        points={points
                          .map((p) => p.map((v) => v * 1000).join(","))
                          .join(" ")}
                      />
                      {points.map(([x, y], i) => (
                        <g key={i}>
                          <circle cx={x * 1000} cy={y * 1000} r="9" />
                          <text x={x * 1000 + 16} y={y * 1000 - 13}>
                            {i + 1}
                          </text>
                        </g>
                      ))}
                    </svg>
                    {points.map(([x, y], i) => (
                      <button
                        key={i}
                        type="button"
                        className="tv-corner-handle"
                        style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                        aria-label={`Move corner ${i + 1}`}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          draggedCorner.current = i;
                          e.currentTarget.setPointerCapture(e.pointerId);
                        }}
                        onPointerMove={moveCorner}
                        onPointerUp={() => {
                          draggedCorner.current = null;
                        }}
                        onPointerCancel={() => {
                          draggedCorner.current = null;
                        }}
                        onKeyDown={(e) => {
                          const delta = {
                            ArrowLeft: [-0.005, 0],
                            ArrowRight: [0.005, 0],
                            ArrowUp: [0, -0.005],
                            ArrowDown: [0, 0.005],
                          }[e.key];
                          if (delta) {
                            e.preventDefault();
                            setPoints((prev) =>
                              prev.map((p, n) =>
                                n === i
                                  ? p.map((v, a) =>
                                      Math.max(0, Math.min(1, v + delta[a])),
                                    )
                                  : p,
                              ),
                            );
                          }
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </>
                )}
                {!selecting && !compare && !busy && (
                  <span className="tv-scene-caption">
                    <span />
                    Illustrative room preview
                  </span>
                )}
              </div>
              {selecting && (
                <div className="tv-mapping">
                  <div>
                    <strong>
                      Select your {surface} · {points.length}/4 corners
                    </strong>
                    <p>
                      Tap the top-left, top-right, bottom-right, then
                      bottom-left corner of an unobstructed surface. Drag the
                      numbered handles to fine-tune each corner, or use arrow
                      keys.
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        setPoints([]);
                        setError("");
                      }}
                    >
                      Start again
                    </button>
                    <button
                      disabled={!points.length}
                      onClick={() => setPoints((prev) => prev.slice(0, -1))}
                    >
                      Undo point
                    </button>
                    <button
                      onClick={() => {
                        setSelecting(false);
                        setPoints([]);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="tv-yellow"
                      disabled={points.length !== 4}
                      onClick={applySurface}
                    >
                      Apply surface
                    </button>
                  </div>
                  <p className="tv-mapping-keyboard">
                    Keyboard alternative: set each corner as a percentage from
                    the top-left of the photo.
                  </p>
                  <div className="tv-corner-inputs">
                    {[
                      "Top-left",
                      "Top-right",
                      "Bottom-right",
                      "Bottom-left",
                    ].map((name, i) => (
                      <fieldset key={name}>
                        <legend>{name}</legend>
                        {[0, 1].map((axis) => (
                          <label key={axis}>
                            {axis === 0 ? "X" : "Y"}
                            <input
                              aria-label={`${name} ${axis === 0 ? "X" : "Y"} percent`}
                              type="number"
                              min="0"
                              max="100"
                              value={
                                points[i]
                                  ? Math.round(points[i][axis] * 100)
                                  : ""
                              }
                              onChange={(e) => {
                                const value =
                                  Math.min(
                                    100,
                                    Math.max(0, Number(e.target.value)),
                                  ) / 100;
                                setPoints((prev) =>
                                  Array.from(
                                    { length: Math.max(i + 1, prev.length) },
                                    (_, n) =>
                                      n === i
                                        ? [
                                            axis === 0
                                              ? value
                                              : (prev[n]?.[0] ?? 0),
                                            axis === 1
                                              ? value
                                              : (prev[n]?.[1] ?? 0),
                                          ]
                                        : prev[n] || [0, 0],
                                  ),
                                );
                              }}
                            />
                          </label>
                        ))}
                      </fieldset>
                    ))}
                  </div>
                </div>
              )}
              <div className="tv-rooms">
                {rooms
                  .filter((r) => r.category === room.category)
                  .slice(0, 3)
                  .map((r) => (
                    <button
                      key={r.id}
                      className={roomId === r.id ? "selected" : ""}
                      aria-pressed={roomId === r.id}
                      onClick={() => chooseRoom(r.id)}
                    >
                      <div>
                        <img src={r.image} alt="" />
                        {roomId === r.id && (
                          <span>
                            <Check size={14} />
                          </span>
                        )}
                      </div>
                      <strong>{r.name}</strong>
                    </button>
                  ))}
                {uploaded && (
                  <button
                    className={roomId === "upload" ? "selected" : ""}
                    aria-pressed={roomId === "upload"}
                    onClick={() => chooseRoom("upload")}
                  >
                    <div>
                      <img src={uploaded.image} alt="" />
                    </div>
                    <strong>Your room</strong>
                  </button>
                )}
                <button
                  className="tv-upload"
                  onClick={() => file.current.click()}
                  disabled={uploading}
                >
                  <div>
                    <Upload size={23} />
                    <span>
                      {uploading ? "Opening photo…" : "Upload your room"}
                    </span>
                  </div>
                  <small>JPG, PNG, WebP · up to 15 MB</small>
                </button>
              </div>
              <input
                ref={file}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={upload}
              />
              <div className="tv-preview-note">
                <span>Your photos stay on your device.</span>
                {roomId === "upload" && !selecting && (
                  <button
                    onClick={() => {
                      setSelecting(true);
                      setPoints(room[surface]?.quad || []);
                      setZoom(1);
                      setCompare(false);
                    }}
                  >
                    <Move size={13} />
                    Adjust {surface} area
                  </button>
                )}
              </div>
              <div className="tv-saved-designs">
                <div>
                  <h2>Your shortlist</h2>
                  <span>
                    {saved.length}/6 designs ·{" "}
                    {roomId === "upload"
                      ? "Photos saved for this visit only"
                      : "Saved on this device"}
                  </span>
                </div>
                <div className="tv-save-form">
                  <input
                    aria-label="Design name"
                    maxLength={40}
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    placeholder="Name this finish, e.g. Kitchen option A"
                  />
                  <button
                    onClick={saveDesign}
                    disabled={!photo || selecting || saved.length >= 6}
                  >
                    <BookmarkPlus size={16} />
                    Save design
                  </button>
                </div>
                {!saved.length && (
                  <p>Save a few options, then compare them in the same room.</p>
                )}
                <div className="tv-design-list">
                  {saved.map((d) => (
                    <article key={d.id}>
                      <span
                        style={{
                          background: shades[d.finishes.floor.shade][1],
                        }}
                      />
                      <div>
                        <strong>{d.name}</strong>
                        <small>
                          {rooms.find((r) => r.id === d.roomId)?.name ||
                            "Your room"}{" "}
                          · {d.finishes.floor.material}
                        </small>
                      </div>
                      <button onClick={() => restoreDesign(d)}>Load</button>
                      <button
                        aria-label={`Remove ${d.name}`}
                        onClick={() =>
                          setSaved((prev) => prev.filter((x) => x.id !== d.id))
                        }
                      >
                        <X size={14} />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </section>
            <aside className="tv-controls" aria-label="Finish controls">
              <div className="tv-segments" aria-label="Surface">
                {surfaceKeys
                  .filter(
                    (s) => room[s] || (roomId === "upload" && s !== "wall2"),
                  )
                  .map((s) => (
                    <button
                      key={s}
                      aria-pressed={surface === s}
                      className={surface === s ? "active" : ""}
                      onClick={() => selectSurface(s)}
                    >
                      {room[s]?.label || (s === "floor" ? "Floor" : "Wall")}
                    </button>
                  ))}
              </div>
              <details className="tv-presets">
                <summary>Start with a curated finish</summary>
                {finishPresets.map((p) => (
                  <button key={p.name} onClick={() => update(p.finish)}>
                    <strong>{p.name}</strong>
                    <small>{p.description}</small>
                  </button>
                ))}
              </details>
              {surface !== "floor" && finishes[surface] && (
                <button
                  className="tv-remove-wall"
                  onClick={() =>
                    setFinishes((prev) => ({ ...prev, [surface]: null }))
                  }
                >
                  Restore original surface
                </button>
              )}
              <fieldset className="tv-control-section">
                <legend>
                  Grout colour <span>{shades[finish.shade][0]}</span>
                </legend>
                <div className="tv-swatches">
                  {shades.map(([name, hex], i) => (
                    <button
                      key={name}
                      aria-label={name}
                      title={name}
                      aria-pressed={finish.shade === i}
                      style={{ background: hex }}
                      onClick={() => update({ shade: i })}
                    >
                      {finish.shade === i && (
                        <Check
                          size={18}
                          style={{ color: i === 5 ? "white" : "#202624" }}
                        />
                      )}
                    </button>
                  ))}
                </div>
                <p className="tv-help">
                  Illustrative colours. Confirm with a physical shade sample.
                </p>
              </fieldset>
              <div className="tv-control-section">
                <label className="tv-label" htmlFor="joint-width">
                  Joint width <output>{finish.width} mm</output>
                </label>
                <input
                  id="joint-width"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={finish.width}
                  onChange={(e) => update({ width: Number(e.target.value) })}
                  style={{
                    "--range-progress": `${((finish.width - 1) / 9) * 100}%`,
                  }}
                />
                <div className="tv-range-ends">
                  <span>1 mm</span>
                  <span>10 mm</span>
                </div>
              </div>
              <fieldset className="tv-control-section">
                <legend>Tile finish</legend>
                <div className="tv-materials">
                  {materials.map((m) => (
                    <button
                      key={m.id}
                      aria-pressed={finish.material === m.id}
                      onClick={() => update({ material: m.id })}
                    >
                      <span className={`tv-material-sample ${m.id}`} />
                      <span>{m.name}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="tv-control-section tv-layout">
                <legend>Layout</legend>
                <div>
                  {layouts.map(([id, name]) => (
                    <button
                      key={id}
                      aria-pressed={finish.layout === id}
                      onClick={() => update({ layout: id })}
                    >
                      <span
                        className={`tv-pattern-icon pattern-${id}`}
                        aria-hidden="true"
                      />
                      {name}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="tv-rotation">
                <legend>Rotation</legend>
                <div>
                  {[0, 90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      aria-pressed={(finish.rotation || 0) === deg}
                      onClick={() => update({ rotation: deg })}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="tv-size">
                Tile size
                <select
                  aria-label="Tile size"
                  value={finish.size}
                  onChange={(e) => update({ size: Number(e.target.value) })}
                >
                  {[300, 600, 900].map((size) => (
                    <option key={size} value={size}>
                      {tileDimensions(size, finish.layout).join(" × ")} mm
                    </option>
                  ))}
                </select>
              </label>
              <details className="tv-planner">
                <summary>Plan your tile quantity</summary>
                <div className="tv-plan-fields">
                  <label>
                    Surface area (m²)
                    <input
                      type="number"
                      min="0.1"
                      max="100000"
                      step="0.1"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                    />
                  </label>
                  <label>
                    Extra for cuts (%)
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={waste}
                      onChange={(e) => setWaste(e.target.value)}
                    />
                  </label>
                </div>
                {estimate ? (
                  <p>
                    <strong>{estimate.count} tiles</strong> ·{" "}
                    {dimensions.join(" × ")} mm
                    <br />
                    {estimate.purchaseArea.toFixed(1)} m² including allowance.
                  </p>
                ) : (
                  <p>Enter a valid area and a 0–30% allowance.</p>
                )}
                <small>
                  Estimate for the selected {surface}; excludes pack rounding.
                  Confirm measurements and cuts with your installer.
                </small>
              </details>
              <Link to="/products?search=stylo" className="tv-product">
                <img
                  src="/images/packaging/50-thumb.webp"
                  alt="TruBuild STYLO 3K grout"
                />
                <span>
                  <strong>Explore TruBuild grouts</strong>
                  <small>Find the right product for your space.</small>
                </span>
                <ArrowUpRight size={18} />
              </Link>
              <Link to={enquiry} className="tv-enquire">
                Enquire about this finish <ArrowUpRight size={18} />
              </Link>
              <p className="tv-help tv-suitability">
                Preview widths are illustrative. Check the selected grout’s
                technical data for permitted joint sizes.
              </p>
            </aside>
          </div>
          {!previewInView && (
            <button
              className="tv-mobile-preview"
              onClick={() =>
                scene.current?.scrollIntoView({
                  behavior: "auto",
                  block: "start",
                })
              }
            >
              See room preview <ArrowUpRight size={16} />
            </button>
          )}
        </div>
        {error && (
          <div role="alert" className="tv-message tv-error">
            {error}
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}
        <p className="tv-status" role="status">
          {status}
        </p>
        <div className="tv-footer">
          <span>Made for the finishing touch.</span>
          <span>TruBuild · Built for life.</span>
        </div>
      </div>
    </div>
  );
}
