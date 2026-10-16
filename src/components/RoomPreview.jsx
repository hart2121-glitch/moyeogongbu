import { useEffect, useState } from "react";

export default function RoomPreview({ preview }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [preview.src]);

  return (
    <div className="theme-image">
      {preview.src && !failed ? (
        <img
          src={preview.src}
          alt={preview.alt}
          style={{ objectFit: preview.fit || "cover" }}
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="theme-placeholder"
          role="img"
          aria-label={`${preview.alt}: ${preview.placeholder}`}
        >
          <span>{preview.placeholder}</span>
          <small>스터디룸 원본 등록 후 표시됩니다</small>
        </div>
      )}
    </div>
  );
}
