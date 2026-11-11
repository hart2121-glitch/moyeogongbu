import { useCallback, useEffect, useRef, useState } from "react";
import { createAmbienceEngine, type AmbienceEngine } from "../model/ambienceEngine";
import { AMBIENCE_CONFIG, clampVolume, parseSettings, type AmbienceSettings, type AmbienceSound } from "../model/ambienceRules";

const load = (): AmbienceSettings => {
  try {
    return parseSettings(window.localStorage.getItem(AMBIENCE_CONFIG.storageKey));
  } catch {
    return parseSettings(null);
  }
};

const save = (settings: AmbienceSettings) => {
  try {
    window.localStorage.setItem(AMBIENCE_CONFIG.storageKey, JSON.stringify(settings));
  } catch {
    // 저장소를 못 쓰는 브라우저: 이번 방문에만 기억한다
  }
};

/**
 * 공부방 백색소음 (Story 012). 고른 소리와 음량은 이 브라우저에 기억해 다음에 방에 들어올 때 다시 켠다.
 * 이 훅을 쓰는 화면이 사라지면(방을 나가면) 소리를 끈다.
 * `waiting`은 브라우저가 소리를 막아 첫 누름을 기다리는 중이라는 뜻이다.
 * @example const ambience = useAmbience(); ambience.choose("rain");
 */
export function useAmbience() {
  const [settings, setSettings] = useState(load);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const engine = useRef<AmbienceEngine | null>(null);

  useEffect(() => {
    const created = createAmbienceEngine({ volume: settings.volume });
    engine.current = created;
    return () => {
      created.close();
      if (engine.current === created) engine.current = null;
    };
    // 엔진은 화면마다 하나. 음량은 아래 효과가 맞춘다.
  }, []);

  useEffect(() => {
    const current = engine.current;
    if (!current) return;
    let live = true;
    setError("");
    current
      .play(settings.sound)
      .then((running) => live && setWaiting(settings.sound !== "off" && !running))
      .catch(() => {
        if (!live) return;
        setError(settings.sound === "cafe" ? "카페 소리를 불러오지 못했어요." : "이 브라우저에서는 소리를 낼 수 없어요.");
        setSettings((s) => ({ ...s, sound: "off" }));
      });
    return () => {
      live = false;
    };
  }, [settings.sound]);

  useEffect(() => {
    engine.current?.setVolume(settings.volume);
  }, [settings.volume]);

  useEffect(() => save(settings), [settings]);

  // 첫 누름으로 소리가 풀리면 기다림 표시를 지운다.
  useEffect(() => {
    if (!waiting) return;
    const clear = () => setWaiting(false);
    window.addEventListener("pointerdown", clear, { once: true, capture: true });
    window.addEventListener("keydown", clear, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", clear, true);
      window.removeEventListener("keydown", clear, true);
    };
  }, [waiting]);

  return {
    sound: settings.sound,
    volume: settings.volume,
    waiting,
    error,
    choose: useCallback((sound: AmbienceSound) => setSettings((s) => ({ ...s, sound })), []),
    setVolume: useCallback((volume: number) => setSettings((s) => ({ ...s, volume: clampVolume(volume) })), []),
  };
}
