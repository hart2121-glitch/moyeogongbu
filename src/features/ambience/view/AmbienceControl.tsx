import { useCallback, useRef, useState, type ComponentType } from "react";
import { CloudRain, Coffee, Keyboard, SpeakerHigh, SpeakerSlash, type IconProps } from "@phosphor-icons/react";
import { AMBIENCE_SOUNDS, type AmbienceSound } from "../model/ambienceRules";
import { useDismiss } from "../../shell/viewmodel/useDismiss";
import { useAmbience } from "../viewmodel/useAmbience";
import "./ambience.css";

const ICONS: Record<AmbienceSound, ComponentType<IconProps>> = {
  off: SpeakerSlash,
  rain: CloudRain,
  keyboard: Keyboard,
  cafe: Coffee,
};

/**
 * 공부방 툴바의 "소리" 단추 (Story 012). 누르면 작은 창에서 빗소리, 키보드, 카페 소리와 음량을 고른다.
 * 바깥을 누르거나 Esc로 닫는다. 방을 나가면 소리가 꺼진다.
 */
export default function AmbienceControl() {
  const ambience = useAmbience();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useDismiss(box, open, useCallback(() => setOpen(false), []));

  const playing = ambience.sound !== "off";
  const current = AMBIENCE_SOUNDS.find((s) => s.id === ambience.sound);
  const percent = Math.round(ambience.volume * 100);
  return (
    <div className="ambience pop" ref={box} data-testid="ambience" data-sound={ambience.sound} data-waiting={ambience.waiting || undefined}>
      <button
        className={`ambience-toggle${playing ? " is-on" : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={playing ? `방 소리, ${current?.label}` : "방 소리"}
        onClick={() => setOpen((v) => !v)}
      >
        {playing ? <SpeakerHigh weight="duotone" /> : <SpeakerSlash />}
        {playing ? current?.label : "소리"}
      </button>
      {open && (
        <div className="pop-panel ambience-panel" role="dialog" aria-label="방 소리">
          <div className="ambience-sounds" role="group" aria-label="소리 고르기">
            {AMBIENCE_SOUNDS.map(({ id, label }) => {
              const Icon = ICONS[id];
              return (
                <button key={id} aria-pressed={ambience.sound === id} onClick={() => ambience.choose(id)}>
                  <Icon weight={ambience.sound === id ? "duotone" : "regular"} />
                  {label}
                </button>
              );
            })}
          </div>
          <label className="ambience-volume">
            <span>음량</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={percent}
              aria-valuetext={`${percent}%`}
              onChange={(e) => ambience.setVolume(Number(e.target.value) / 100)}
            />
            <output>{percent}</output>
          </label>
          {ambience.error && <p role="alert">{ambience.error}</p>}
        </div>
      )}
    </div>
  );
}
