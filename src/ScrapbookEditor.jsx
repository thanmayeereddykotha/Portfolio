import { useState, useCallback, useEffect } from "react";
import { scrapbookConfig } from "./scrapbook.config.js";

// ─────────────────────────────────────────────────────────────────
//  Helper to dynamically compute arrow SVG path and arrowTip
// ─────────────────────────────────────────────────────────────────
export function getArrowSvgPaths(width, height, style = "simple", direction = "down-right") {
  const w = width;
  const h = height;
  let path = "";
  let arrowTip = "";

  if (style === "loop") {
    if (direction === "down-right") {
      path = `M 10,10 C ${w * 0.45},${h * 0.05} ${w * 0.65},${h * 0.95} ${w * 0.45},${h * 0.95} C ${w * 0.25},${h * 0.95} ${w * 0.45},${h * 0.05} ${w - 12},${h - 12}`;
      arrowTip = `M ${w - 12},${h - 12} L ${w - 24},${h - 10} M ${w - 12},${h - 12} L ${w - 16},${h - 24}`;
    } else if (direction === "down-left") {
      path = `M ${w - 10},10 C ${w * 0.55},${h * 0.05} ${w * 0.35},${h * 0.95} ${w * 0.55},${h * 0.95} C ${w * 0.75},${h * 0.95} ${w * 0.55},${h * 0.05} 12,${h - 12}`;
      arrowTip = `M 12,${h - 12} L 24,${h - 10} M 12,${h - 12} L 16,${h - 24}`;
    } else if (direction === "up-right") {
      path = `M 10,${h - 10} C ${w * 0.45},${h * 0.95} ${w * 0.65},${h * 0.05} ${w * 0.45},${h * 0.05} C ${w * 0.25},${h * 0.05} ${w * 0.45},${h * 0.95} ${w - 12},12`;
      arrowTip = `M ${w - 12},12 L ${w - 24},10 M ${w - 12},12 L ${w - 16},24`;
    } else {
      // up-left
      path = `M ${w - 10},${h - 10} C ${w * 0.55},${h * 0.95} ${w * 0.35},${h * 0.05} ${w * 0.55},${h * 0.05} C ${w * 0.75},${h * 0.05} ${w * 0.55},${h * 0.95} 12,12`;
      arrowTip = `M 12,12 L 24,10 M 12,12 L 16,24`;
    }
  } else if (style === "sharp") {
    let x1, y1, x2, y2;
    if (direction === "down-right") {
      x1 = 10; y1 = 10;
      x2 = w - 12; y2 = h - 12;
    } else if (direction === "down-left") {
      x1 = w - 10; y1 = 10;
      x2 = 12; y2 = h - 12;
    } else if (direction === "up-right") {
      x1 = 10; y1 = h - 10;
      x2 = w - 12; y2 = 12;
    } else {
      // up-left
      x1 = w - 10; y1 = h - 10;
      x2 = 12; y2 = 12;
    }
    path = `M ${x1},${y1} L ${x2},${y2}`;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len;
    const uy = dy / len;

    const arrowLength = 15;
    const angle = Math.PI / 6; // 30 degrees

    const xLeft = x2 - arrowLength * (ux * Math.cos(angle) - uy * Math.sin(angle));
    const yLeft = y2 - arrowLength * (uy * Math.cos(angle) + ux * Math.sin(angle));
    const xRight = x2 - arrowLength * (ux * Math.cos(angle) + uy * Math.sin(angle));
    const yRight = y2 - arrowLength * (uy * Math.cos(angle) - ux * Math.sin(angle));

    arrowTip = `M ${x2},${y2} L ${xLeft},${yLeft} M ${x2},${y2} L ${xRight},${yRight}`;
  } else if (style === "wavy") {
    if (direction === "down-right") {
      path = `M 10,10 C ${w * 0.3},${h * 0.1} ${w * 0.7},${h * 0.9} ${w - 12},${h - 12}`;
      arrowTip = `M ${w - 12},${h - 12} L ${w - 24},${h - 10} M ${w - 12},${h - 12} L ${w - 16},${h - 24}`;
    } else if (direction === "down-left") {
      path = `M ${w - 10},10 C ${w * 0.7},${h * 0.1} ${w * 0.3},${h * 0.9} 12,${h - 12}`;
      arrowTip = `M 12,${h - 12} L 24,${h - 10} M 12,${h - 12} L 16,${h - 24}`;
    } else if (direction === "up-right") {
      path = `M 10,${h - 10} C ${w * 0.3},${h * 0.9} ${w * 0.7},${h * 0.1} ${w - 12},12`;
      arrowTip = `M ${w - 12},12 L ${w - 24},10 M ${w - 12},12 L ${w - 16},24`;
    } else {
      // up-left
      path = `M ${w - 10},${h - 10} C ${w * 0.7},${h * 0.9} ${w * 0.3},${h * 0.1} 12,12`;
      arrowTip = `M 12,12 L 24,10 M 12,12 L 16,24`;
    }
  } else {
    // simple
    if (direction === "down-right") {
      path = `M 10,10 Q ${w * 0.5},${h * 0.1} ${w - 12},${h - 12}`;
      arrowTip = `M ${w - 12},${h - 12} L ${w - 24},${h - 10} M ${w - 12},${h - 12} L ${w - 16},${h - 24}`;
    } else if (direction === "down-left") {
      path = `M ${w - 10},10 Q ${w * 0.5},${h * 0.1} 12,${h - 12}`;
      arrowTip = `M 12,${h - 12} L 24,${h - 10} M 12,${h - 12} L 16,${h - 24}`;
    } else if (direction === "up-right") {
      path = `M 10,${h - 10} Q ${w * 0.5},${h * 0.9} ${w - 12},12`;
      arrowTip = `M ${w - 12},12 L ${w - 24},10 M ${w - 12},12 L ${w - 16},24`;
    } else {
      // up-left
      path = `M ${w - 10},${h - 10} Q ${w * 0.5},${h * 0.9} 12,12`;
      arrowTip = `M 12,12 L 24,10 M 12,12 L 16,24`;
    }
  }

  return { path, arrowTip };
}

function Slider({ label, value, min, max, step = 0.1, onChange }) {
  return (
    <div className="sed-row">
      <span className="sed-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="sed-slider"
      />
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="sed-num"
      />
    </div>
  );
}

function Dropdown({ label, value, options, onChange }) {
  return (
    <div className="sed-row">
      <span className="sed-label">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sed-select"
        style={{
          background: "#2e2924",
          color: "#fff",
          border: "1px solid #4a4138",
          padding: "4px 8px",
          borderRadius: "4px",
          flex: 1,
          fontFamily: "inherit",
          fontSize: "0.85rem",
          cursor: "pointer"
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="sed-row" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span className="sed-label">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sed-color"
        style={{
          border: "1px solid #4a4138",
          background: "transparent",
          cursor: "pointer",
          width: "42px",
          height: "26px",
          padding: 0,
          borderRadius: "4px"
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sed-num"
        style={{
          width: "80px",
          textAlign: "center",
          fontFamily: "monospace"
        }}
      />
    </div>
  );
}

function TextInput({ label, value, onChange }) {
  return (
    <div className="sed-row" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span className="sed-label">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sed-num"
        style={{
          flex: 1,
          textAlign: "left",
          fontFamily: "inherit",
          fontSize: "0.85rem",
          padding: "4px 8px",
          background: "#2e2924",
          color: "#fff",
          border: "1px solid #4a4138",
          borderRadius: "4px"
        }}
      />
    </div>
  );
}

function TextAreaInput({ label, value, onChange }) {
  return (
    <div className="sed-row" style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "stretch" }}>
      <span className="sed-label">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sed-num"
        rows={3}
        style={{
          width: "100%",
          textAlign: "left",
          fontFamily: "inherit",
          fontSize: "0.85rem",
          padding: "4px 8px",
          background: "#2e2924",
          color: "#fff",
          border: "1px solid #4a4138",
          borderRadius: "4px",
          resize: "vertical"
        }}
      />
    </div>
  );
}

function ElementPanel({ title, data, onChange, fields }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sed-elem">
      <button className="sed-elem-header" onClick={() => setOpen((o) => !o)}>
        <span>{open ? "▾" : "▸"}</span>
        <span className="sed-elem-title">{title}</span>
        <span className="sed-elem-id">{data.id}</span>
      </button>
      {open && (
        <div className="sed-elem-body">
          {fields.map((field) => {
            const val = data[field.key] ?? field.default;
            if (field.type === "select") {
              return (
                <Dropdown
                  key={field.key}
                  label={field.label}
                  value={val}
                  options={field.options}
                  onChange={(v) => onChange(data.id, field.key, v)}
                />
              );
            }
            if (field.type === "textarea") {
              return (
                <TextAreaInput
                  key={field.key}
                  label={field.label}
                  value={val}
                  onChange={(v) => onChange(data.id, field.key, v)}
                />
              );
            }
            if (field.type === "text") {
              return (
                <TextInput
                  key={field.key}
                  label={field.label}
                  value={val}
                  onChange={(v) => onChange(data.id, field.key, v)}
                />
              );
            }
            if (field.type === "color") {
              return (
                <ColorPicker
                  key={field.key}
                  label={field.label}
                  value={val}
                  onChange={(v) => onChange(data.id, field.key, v)}
                />
              );
            }
            return (
              <Slider
                key={field.key}
                label={field.label}
                value={val}
                min={field.min}
                max={field.max}
                step={field.step ?? 0.1}
                onChange={(v) => onChange(data.id, field.key, v)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ScrapbookEditor({ config, onChange }) {
  const [tab, setTab] = useState("p1_texts");
  const [copied, setCopied] = useState(false);

  // Derive activePage (p1, p2, or p3) and activeSection
  const activePage = tab.split("_")[0];
  const activeSection = tab.split("_")[1];

  // Position state (starts at top-right with standard 16px offsets)
  const [position, setPosition] = useState({
    x: window.innerWidth - 360 - 16,
    y: 16
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle double clicking header to reset to top-right
  const handleDoubleClick = () => {
    setPosition({
      x: window.innerWidth - 360 - 16,
      y: 16
    });
  };

  const handleMouseDown = (e) => {
    // Only drag with left click
    if (e.button !== 0) return;
    
    // Don't drag if they click on buttons/inputs/select elements
    if (e.target.closest("button") || e.target.closest("input") || e.target.closest("select")) {
      return;
    }
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      // Clamp coordinates so panel header remains inside readable bounds
      const newX = Math.max(10, Math.min(window.innerWidth - 360 - 10, e.clientX - dragOffset.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleChange = useCallback(
    (id, key, value) => {
      onChange((prev) => {
        const pageData = prev[activePage] || {};
        const sectionData = pageData[activeSection];
        
        // Handle single object configuration (like title or profile)
        if (id === "title" || id === "profile") {
          return {
            ...prev,
            [activePage]: {
              ...pageData,
              [activeSection]: {
                ...pageData[activeSection],
                [key]: value
              }
            }
          };
        }
        
        // Handle array configurations (like texts, emojis, arrows, notes, skills, tools)
        const list = Array.isArray(sectionData) ? sectionData : [];
        return {
          ...prev,
          [activePage]: {
            ...pageData,
            [activeSection]: list.map((item) =>
              item.id === id ? { ...item, [key]: value } : item
            ),
          },
        };
      });
    },
    [activePage, activeSection, onChange]
  );

  const handleArrowChange = useCallback(
    (id, key, value) => {
      onChange((prev) => {
        const pageData = prev[activePage] || {};
        const arrows = pageData.arrows || [];
        return {
          ...prev,
          [activePage]: {
            ...pageData,
            arrows: arrows.map((item) => {
              if (item.id !== id) return item;
              const updated = {
                ...item,
                [key]: value
              };
              if (["width", "height", "style", "direction"].includes(key)) {
                const { path, arrowTip } = getArrowSvgPaths(
                  updated.width,
                  updated.height,
                  updated.style ?? "simple",
                  updated.direction ?? "down-right"
                );
                updated.path = path;
                updated.arrowTip = arrowTip;
              }
              return updated;
            }),
          },
        };
      });
    },
    [activePage, onChange]
  );

  const copyConfig = () => {
    const json = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(
      `export const scrapbookConfig = ${json};`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const textFields = [
    { key: "label", label: "Text Content", type: "text", default: "" },
    { key: "top", label: "Top %", min: 0, max: 100, step: 0.5 },
    { key: "left", label: "Left %", min: 0, max: 100, step: 0.5 },
    { key: "rotate", label: "Rotate °", min: -360, max: 360, step: 1 },
    { key: "size", label: "Size rem", min: 0.5, max: 5, step: 0.05 },
    { key: "width", label: "Width px", min: 50, max: 600, step: 5, default: 200 },
  ];

  const videoFields = [
    { key: "brandName", label: "Brand Text", type: "text", default: "" },
    { key: "videoUrl", label: "Vimeo URL", type: "text", default: "" },
    { key: "top", label: "Top %", min: 0, max: 100, step: 0.5 },
    { key: "left", label: "Left %", min: 0, max: 100, step: 0.5 },
    { key: "rotate", label: "Rotate °", min: -360, max: 360, step: 1 },
    { key: "size", label: "Size px", min: 50, max: 400, step: 1, default: 160 },
    {
      key: "fontFamily",
      label: "Font Family",
      type: "select",
      options: [
        { value: "'Inter', sans-serif", label: "Inter (Modern Sans)" },
        { value: "'Playfair Display', serif", label: "Playfair (Elegant Serif)" },
        { value: "'Caveat', cursive", label: "Caveat (Handwritten Cursive)" },
        { value: "'Dancing Script', cursive", label: "Dancing Script (Elegant Cursive)" },
        { value: "'Cinzel', serif", label: "Cinzel (Classic Serif)" },
        { value: "'Italiana', serif", label: "Italiana (Graceful Serif)" },
        { value: "'Sacramento', cursive", label: "Sacramento (Graceful Cursive)" }
      ],
      default: "'Inter', sans-serif"
    },
    { key: "textSize", label: "Font Size", min: 0.5, max: 3, step: 0.05, default: 0.95 }
  ];

  const skillFields = [
    { key: "label", label: "Skill Text", type: "text", default: "" },
    { key: "top", label: "Top %", min: 0, max: 100, step: 0.5 },
    { key: "left", label: "Left %", min: 0, max: 100, step: 0.5 },
    { key: "rotate", label: "Rotate °", min: -360, max: 360, step: 1 },
    { key: "size", label: "Card Size", min: 0.5, max: 5, step: 0.05 },
    { key: "width", label: "Width px", min: 50, max: 600, step: 5, default: 200 },
    { key: "rating", label: "Stars Rating", min: 1, max: 5, step: 1, default: 5 },
    { key: "textSize", label: "Text Size rem", min: 0.5, max: 4, step: 0.05, default: 1.2 },
    {
      key: "fontFamily",
      label: "Font Family",
      type: "select",
      options: [
        { value: "'Inter', sans-serif", label: "Inter (Modern Sans)" },
        { value: "'Playfair Display', serif", label: "Playfair (Elegant Serif)" },
        { value: "'Caveat', cursive", label: "Caveat (Handwritten Cursive)" },
        { value: "'Dancing Script', cursive", label: "Dancing Script (Elegant Cursive)" },
        { value: "'Cinzel', serif", label: "Cinzel (Classic Serif)" },
        { value: "'Italiana', serif", label: "Italiana (Graceful Serif)" },
        { value: "'Sacramento', cursive", label: "Sacramento (Graceful Cursive)" }
      ],
      default: "'Inter', sans-serif"
    }
  ];

  const emojiFields = [
    { key: "emoji", label: "Emoji/Logo", type: "text", default: "" },
    { key: "top", label: "Top %", min: 0, max: 100, step: 0.5 },
    { key: "left", label: "Left %", min: 0, max: 100, step: 0.5 },
    { key: "rotate", label: "Rotate °", min: -360, max: 360, step: 1 },
    { key: "size", label: "Size rem", min: 0.5, max: 6, step: 0.05 },
  ];

  const toolFields = [
    { key: "name", label: "Tool Name", type: "text", default: "" },
    {
      key: "svgType",
      label: "SVG Type",
      type: "select",
      options: [
        { value: "pinterest", label: "Pinterest" },
        { value: "instagram", label: "Instagram" },
        { value: "davinciresolve", label: "DaVinci Resolve" },
        { value: "canva", label: "Canva" },
        { value: "photoshop", label: "Photoshop" },
        { value: "capcut", label: "CapCut" },
        { value: "inshot", label: "InShot" }
      ],
      default: "pinterest"
    },
    { key: "color", label: "Color/Gradient", type: "text", default: "#BD081C" },
    { key: "top", label: "Top %", min: 0, max: 100, step: 0.5 },
    { key: "left", label: "Left %", min: 0, max: 100, step: 0.5 },
    { key: "rotate", label: "Rotate °", min: -360, max: 360, step: 1 },
    { key: "size", label: "Size (x16 px)", min: 0.5, max: 10, step: 0.05 }
  ];

  const arrowFields = [
    { key: "top", label: "Top %", min: 0, max: 100, step: 0.5 },
    { key: "left", label: "Left %", min: 0, max: 100, step: 0.5 },
    { key: "rotate", label: "Rotate °", min: -360, max: 360, step: 1 },
    { key: "width", label: "Width px", min: 10, max: 400, step: 1 },
    { key: "height", label: "Height px", min: 10, max: 400, step: 1 },
    { key: "strokeWidth", label: "Stroke px", min: 1, max: 15, step: 0.5, default: 2.5 },
    {
      key: "style",
      label: "Style",
      type: "select",
      options: [
        { value: "simple", label: "Simple" },
        { value: "wavy", label: "Wavy" },
        { value: "loop", label: "Loop" },
        { value: "sharp", label: "Sharp" }
      ],
      default: "simple"
    },
    {
      key: "direction",
      label: "Direction",
      type: "select",
      options: [
        { value: "down-right", label: "Down-Right" },
        { value: "down-left", label: "Down-Left" },
        { value: "up-right", label: "Up-Right" },
        { value: "up-left", label: "Up-Left" }
      ],
      default: "down-right"
    }
  ];

  const noteFields = [
    { key: "title", label: "Note Title", type: "text", default: "" },
    { key: "text", label: "Note Content", type: "textarea", default: "" },
    {
      key: "type",
      label: "Paper Style",
      type: "select",
      options: [
        { value: "white", label: "White (Elegant Note)" },
        { value: "red", label: "Red (2-Page Context Card)" },
        { value: "booklet", label: "Booklet (3-Page Open Booklet)" }
      ],
      default: "white"
    },
    {
      key: "speed",
      label: "Parallax Speed",
      type: "select",
      options: [
        { value: "slow", label: "Slow" },
        { value: "medium", label: "Medium" }
      ],
      default: "slow"
    },
    { key: "coverTitle", label: "Cover Title", type: "text", default: "" },
    { key: "coverSubtitle", label: "Cover Subtitle", type: "text", default: "" },
    { key: "coverCursive", label: "Cover Cursive", type: "text", default: "" },
    { key: "image1", label: "Image 1 (Product)", type: "text", default: "" },
    { key: "image2", label: "Image 2 (Model/UGC)", type: "text", default: "" },
    { key: "top", label: "Top %", min: 0, max: 100, step: 0.5 },
    { key: "left", label: "Left %", min: 0, max: 100, step: 0.5 },
    { key: "rotate", label: "Rotate °", min: -360, max: 360, step: 1 },
    { key: "width", label: "Width px", min: 100, max: 800, step: 5 },
    { key: "size", label: "Size rem", min: 0.5, max: 2.5, step: 0.05, default: 1 },
  ];

  const titleFields = [
    { key: "label", label: "Title Text", type: "text", default: "" },
    ...(activePage === "p3" ? [{ key: "subtitle", label: "Subtitle Text", type: "text", default: "" }] : []),
    { key: "top", label: "Top %", min: 0, max: 100, step: 0.5 },
    { key: "left", label: "Left %", min: 0, max: 100, step: 0.5 },
    { key: "rotate", label: "Rotate °", min: -360, max: 360, step: 1 },
    { key: "size", label: "Size rem", min: 0.5, max: 10, step: 0.1 },
  ];

  return (
    <div
      className="sed-panel"
      role="dialog"
      aria-label="Scrapbook Layout Editor"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        right: "auto", // Override CSS absolute right position
      }}
    >
      {/* Header (Acts as a drag handle) */}
      <div
        className="sed-header"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none"
        }}
        title="Drag header to move panel · Double click to reset position"
      >
        <span className="sed-logo">✏️</span>
        <span className="sed-title">Scrapbook Editor</span>
        <button className="sed-copy" onClick={copyConfig} title="Copy config to clipboard">
          {copied ? "✅ Copied!" : "📋 Copy Config"}
        </button>
      </div>

      {/* Tabs */}
      <div className="sed-tabs" style={{ display: "flex", flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {[
          { id: "p1_title", label: "1: Title" },
          { id: "p1_texts", label: "1: Texts" },
          { id: "p1_emojis", label: "1: Emojis" },
          { id: "p1_arrows", label: "1: Arrows" },
          { id: "p1_profile", label: "1: Profile" },
          { id: "p2_title", label: "2: Title" },
          { id: "p2_skills", label: "2: Skills" },
          { id: "p2_tools", label: "2: Tools" },
          { id: "p2_emojis", label: "2: Logos" },
          { id: "p2_arrows", label: "2: Arrows" },
          { id: "p3_title", label: "3: Title" },
          { id: "p3_notes", label: "3: Notes" },
          { id: "p3_emojis", label: "3: Logos" },
          { id: "p3_texts", label: "3: Texts" },
          { id: "p3_arrows", label: "3: Arrows" },
          { id: "p4_title", label: "4: Title" },
          { id: "p4_videos", label: "4: Videos" },
          { id: "p4_arrows", label: "4: Arrows" },
        ].map((t) => (
          <button
            key={t.id}
            className={`sed-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
            style={{
              flex: "1 1 18%", // wrap nicely since we have 15 tabs now
              padding: "6px 2px",
              fontSize: "8.5px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="sed-body">
        {activeSection === "texts" &&
          (config[activePage]?.texts || []).map((item) => (
            <ElementPanel
              key={item.id}
              title={`"${(item.label || "").slice(0, 28)}${(item.label || "").length > 28 ? "…" : ""}"`}
              data={item}
              fields={textFields}
              onChange={handleChange}
            />
          ))}

        {activeSection === "emojis" &&
          (config[activePage]?.emojis || []).map((item) => (
            <ElementPanel
              key={item.id}
              title={`${item.emoji}`}
              data={item}
              fields={emojiFields}
              onChange={handleChange}
            />
          ))}

        {activeSection === "arrows" &&
          (config[activePage]?.arrows || []).map((item) => (
            <ElementPanel
              key={item.id}
              title={`Arrow`}
              data={item}
              fields={arrowFields}
              onChange={(id, key, value) => handleArrowChange(id, key, value)}
            />
          ))}

        {activeSection === "notes" &&
          (config[activePage]?.notes || []).map((item) => (
            <ElementPanel
              key={item.id}
              title={`Note: "${(item.title || "").slice(0, 20)}${(item.title || "").length > 20 ? "…" : ""}"`}
              data={item}
              fields={noteFields}
              onChange={handleChange}
            />
          ))}

        {activeSection === "skills" &&
          (config[activePage]?.skills || []).map((item) => (
            <ElementPanel
              key={item.id}
              title={`Skill: "${item.label}"`}
              data={item}
              fields={skillFields}
              onChange={handleChange}
            />
          ))}

        {activeSection === "tools" &&
          (config[activePage]?.tools || []).map((item) => (
            <ElementPanel
              key={item.id}
              title={`Tool: "${item.name}"`}
              data={item}
              fields={toolFields}
              onChange={handleChange}
            />
          ))}

        {activeSection === "videos" &&
          (config[activePage]?.videos || []).map((item) => (
            <ElementPanel
              key={item.id}
              title={`Card: "${item.brandName}"`}
              data={item}
              fields={videoFields}
              onChange={handleChange}
            />
          ))}

        {activeSection === "title" && config[activePage]?.title && (
          <ElementPanel
            title="Page Title"
            data={{
              id: "title",
              ...config[activePage].title
            }}
            fields={titleFields}
            onChange={handleChange}
          />
        )}

        {activeSection === "profile" && (
          <ElementPanel
            title="Profile Layout & Outline"
            data={{
              id: "profile",
              borderColor: config[activePage]?.profile?.borderColor ?? "#c92722",
              borderSize: config[activePage]?.profile?.borderSize ?? 6,
              gapSize: config[activePage]?.profile?.gapSize ?? 4,
              top: config[activePage]?.profile?.top ?? 55,
              left: config[activePage]?.profile?.left ?? 50,
              width: config[activePage]?.profile?.width ?? 480
            }}
            fields={[
              { key: "top", label: "Top %", min: 0, max: 100, step: 0.5 },
              { key: "left", label: "Left %", min: 0, max: 100, step: 0.5 },
              { key: "width", label: "Width px", min: 150, max: 1000, step: 5 },
              { key: "borderColor", label: "Color", type: "color" },
              { key: "borderSize", label: "Size px", min: 0, max: 20, step: 0.5 },
              { key: "gapSize", label: "Gap px", min: 0, max: 30, step: 0.5 }
            ]}
            onChange={(id, key, value) => {
              onChange((prev) => {
                const pageData = prev[activePage] || {};
                const profile = pageData.profile || {};
                return {
                  ...prev,
                  [activePage]: {
                    ...pageData,
                    profile: {
                      borderColor: profile.borderColor ?? "#c92722",
                      borderSize: profile.borderSize ?? 6,
                      gapSize: profile.gapSize ?? 4,
                      top: profile.top ?? 55,
                      left: profile.left ?? 50,
                      width: profile.width ?? 480,
                      [key]: value
                    }
                  }
                };
              });
            }}
          />
        )}
      </div>

      {/* Footer hint */}
      <div className="sed-footer">
        Press <kbd>E</kbd> to hide · <kbd>Ctrl+Z</kbd> to undo in config
      </div>
    </div>
  );
}
