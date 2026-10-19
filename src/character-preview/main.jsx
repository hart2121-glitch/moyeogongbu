import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/gowun-dodum/400.css";
import {
  CANVAS,
  DIRECTIONS,
  LAYERS,
  createPreview,
  poseKey,
  referenceSource,
} from "./model.js";
import { loadLayer } from "./loadLayer.js";
import LayerStack from "./LayerStack.jsx";
import "./preview.css";

function CharacterPreview() {
  const [model, setModel] = useState(createPreview);
  const [pose, setPose] = useState({
    action: "idle",
    direction: "down",
    frame: 0,
  });
  const [zoom, setZoom] = useState(3);
  const [background, setBackground] = useState("checker");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState({});
  const [referenceFailed, setReferenceFailed] = useState(false);
  const [message, setMessage] = useState("");
  const urls = useRef(new Set()),
    requests = useRef({}),
    mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      for (const url of urls.current) URL.revokeObjectURL(url);
      urls.current.clear();
    };
  }, []);
  const key = poseKey(pose);
  const loaded = LAYERS.filter((l) => model.layers[l.id].frames[key]);
  const visible = loaded.filter((l) => model.layers[l.id].enabled);
  const revoke = (asset) => {
    if (asset) {
      URL.revokeObjectURL(asset.src);
      urls.current.delete(asset.src);
    }
  };
  const updateLayer = (id, change) =>
    setModel((old) => ({
      ...old,
      layers: {
        ...old.layers,
        [id]: { ...old.layers[id], ...change(old.layers[id]) },
      },
    }));
  const choose = async (event, id) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const requestKey = `${id}:${key}`,
      token = Symbol();
    requests.current[requestKey] = token;
    setBusy((old) => ({ ...old, [requestKey]: true }));
    setErrors((old) => ({ ...old, [requestKey]: "" }));
    const oldAsset = model.layers[id].frames[key];
    try {
      const asset = await loadLayer(file);
      if (!mounted.current || requests.current[requestKey] !== token) {
        URL.revokeObjectURL(asset.src);
        return;
      }
      urls.current.add(asset.src);
      revoke(oldAsset);
      updateLayer(id, (item) => ({ frames: { ...item.frames, [key]: asset } }));
      setMessage(
        `${DIRECTIONS[pose.direction]} ${LAYERS.find((l) => l.id === id).label} 파일을 불러왔어요.`,
      );
    } catch (e) {
      if (mounted.current && requests.current[requestKey] === token)
        setErrors((old) => ({
          ...old,
          [requestKey]:
            e.message.includes("PNG") || e.message.includes("87")
              ? e.message
              : "이미지를 읽을 수 없어요. 정상적인 PNG인지 확인해 주세요.",
        }));
    } finally {
      if (mounted.current && requests.current[requestKey] === token)
        setBusy((old) => ({ ...old, [requestKey]: false }));
    }
  };
  const remove = (id) => {
    requests.current[`${id}:${key}`] = Symbol();
    setBusy((old) => ({ ...old, [`${id}:${key}`]: false }));
    revoke(model.layers[id].frames[key]);
    updateLayer(id, (item) => {
      const frames = { ...item.frames };
      delete frames[key];
      return { frames };
    });
    setErrors((old) => ({ ...old, [`${id}:${key}`]: "" }));
  };
  const reset = () => {
    requests.current = {};
    for (const url of urls.current) URL.revokeObjectURL(url);
    urls.current.clear();
    setModel(createPreview());
    setBusy({});
    setErrors({});
    setMessage("모든 방향의 레이어 파일과 표시 체크를 초기화했어요.");
  };
  return (
    <main className="cp-app">
      <header className="cp-header">
        <div>
          <span className="cp-badge">개발용 · 게임에 적용되지 않음</span>
          <h1>캐릭터 레이어 미리보기</h1>
          <p>투명 PNG를 겹쳐 보고, 기존 완성형 캐릭터와 비교해 보세요.</p>
        </div>
        <a href="/">로비 열기</a>
      </header>
      <section className="cp-notice" aria-label="사용 안내">
        <strong>분리된 캐릭터 에셋은 아직 없습니다.</strong> 합성 영역은
        처음에는 비어 있습니다. 기존 캐릭터를 잘라 만든 임시 부품은 제공하지
        않습니다.
        <br />
        선택한 파일은 이 탭의 메모리에서만 사용하며 서버에 업로드하거나 게임에
        저장하지 않습니다. 새로고침하면 초기화됩니다.
      </section>
      <section className="cp-toolbar" aria-label="미리보기 설정">
        <label>
          방향
          <select
            aria-label="방향"
            value={pose.direction}
            onChange={(e) => {
              setPose((old) => ({ ...old, direction: e.target.value }));
              setReferenceFailed(false);
              setMessage("");
            }}
          >
            {Object.entries(DIRECTIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          표시 배율
          <select
            aria-label="표시 배율"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}배
              </option>
            ))}
          </select>
        </label>
        <label>
          확인 배경
          <select
            aria-label="확인 배경"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
          >
            <option value="checker">투명 격자</option>
            <option value="light">밝은색</option>
            <option value="dark">어두운색</option>
          </select>
        </label>
        <button type="button" onClick={reset}>
          전체 비우기
        </button>
      </section>
      <div className="cp-workspace">
        <section
          className="cp-comparison"
          aria-label="캐릭터 비교"
          style={{ "--cp-zoom": zoom }}
        >
          <article className="cp-card">
            <h2>기존 완성형 이미지</h2>
            <div className={`cp-board cp-bg-${background}`}>
              <div className="cp-canvas" data-testid="reference-canvas">
                {referenceFailed ? (
                  <span className="cp-reference-error">
                    원본을 불러오지 못했어요.
                  </span>
                ) : (
                  <img
                    src={referenceSource(pose.direction)}
                    alt={`${DIRECTIONS[pose.direction]} 기존 완성형 캐릭터`}
                    onError={() => setReferenceFailed(true)}
                  />
                )}
              </div>
            </div>
            <p>{DIRECTIONS[pose.direction]} · 원본 그대로 비교</p>
          </article>
          <article className="cp-card">
            <h2>레이어 합성 결과</h2>
            <div className={`cp-board cp-bg-${background}`}>
              <LayerStack model={model} pose={pose} />
            </div>
            <p data-testid="layer-count">
              파일 {loaded.length}/6 · 표시 {visible.length}개
            </p>
            {!loaded.length && (
              <p className="cp-empty">
                이 방향에 사용할 레이어 PNG를 불러와 주세요.
              </p>
            )}
          </article>
          <p className="cp-canvas-note">
            양쪽 모두 {CANVAS.width}×{CANVAS.height}px 원본 캔버스의 좌상단 (0,
            0)에 정렬합니다. 배율은 비교 화면에만 적용됩니다.
          </p>
        </section>
        <section className="cp-controls" aria-label="레이어 설정">
          <h2>레이어 설정</h2>
          <p>
            아래 목록은 뒤에서 앞 순서입니다. 파일은 방향별로 따로 선택하고,
            표시 여부는 공통으로 켜고 끌 수 있습니다.
          </p>
          {LAYERS.map((layer) => {
            const item = model.layers[layer.id],
              asset = item.frames[key],
              requestKey = `${layer.id}:${key}`;
            return (
              <fieldset key={layer.id} className="cp-layer">
                <legend>{layer.label}</legend>
                <div className="cp-layer-heading">
                  <label className="cp-toggle">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        updateLayer(layer.id, () => ({ enabled }));
                      }}
                    />
                    {layer.label} 표시
                  </label>
                  <span>{asset ? "파일 선택됨" : "미등록"}</span>
                </div>
                <label className="cp-file-label">
                  {layer.label} PNG
                  <input
                    type="file"
                    accept="image/png,.png"
                    aria-label={`${layer.label} PNG 선택`}
                    onChange={(e) => choose(e, layer.id)}
                  />
                </label>
                <div className="cp-file-info">
                  <span>
                    {busy[requestKey]
                      ? "파일 확인 중…"
                      : asset?.name || "87×110px · 투명 PNG"}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(layer.id)}
                    disabled={!asset && !busy[requestKey]}
                  >
                    파일 제거
                  </button>
                </div>
                {errors[requestKey] && (
                  <p className="cp-error" role="alert">
                    {errors[requestKey]}
                  </p>
                )}
              </fieldset>
            );
          })}
        </section>
      </div>
      <p className="cp-status" role="status">
        {message}
      </p>
      <footer>
        현재는 대기 자세의 정적 합성만 제공합니다. 애니메이션 재생·색상
        변경·상점 연결은 아직 적용하지 않았습니다.
      </footer>
    </main>
  );
}
createRoot(document.getElementById("preview-root")).render(
  <React.StrictMode>
    <CharacterPreview />
  </React.StrictMode>,
);
