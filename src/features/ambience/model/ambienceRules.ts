/**
 * 방 백색소음의 규칙 (Story 012). 브라우저 오디오와 상관없는 순수 함수만 둔다 (tests/ambience.test.mjs).
 * 빗소리와 키보드 소리는 브라우저에서 합성하고, 카페 소리는 CC0 녹음 파일을 되풀이한다 (public/assets/sounds/README.md).
 */

/** 고를 수 있는 소리. off는 끔. */
export type AmbienceSound = "off" | "rain" | "keyboard" | "cafe";

export interface AmbienceSettings {
  sound: AmbienceSound;
  /** 0~1 */
  volume: number;
}

/** 화면 순서와 이름. */
export const AMBIENCE_SOUNDS: readonly { id: AmbienceSound; label: string }[] = [
  { id: "off", label: "끄기" },
  { id: "rain", label: "빗소리" },
  { id: "keyboard", label: "키보드" },
  { id: "cafe", label: "카페" },
];

export const AMBIENCE_CONFIG = {
  /** 저장 열쇠 (localStorage, 이 브라우저에만). */
  storageKey: "moyeogongbu.ambience",
  defaultVolume: 0.5,
  /** 카페 녹음 파일과 되풀이 길이 (tools/audio/cafe_loop.py가 60초로 자른다). */
  cafeUrl: "/assets/sounds/cafe-loop.mp3",
  cafeLoopSeconds: 60,
  /** 소리를 바꿀 때 서서히 켜고 끄는 시간 (초). */
  fadeSeconds: 0.6,
  /** 빗방울 수 (초당 평균). */
  dripsPerSecond: 5,
  /** 화면이 보일 때와 숨었을 때 미리 짜 두는 시간 (초). 숨은 탭은 타이머가 1초에 한 번만 돈다. */
  lookaheadSeconds: { visible: 0.4, hidden: 2.5 },
} as const;

const DEFAULT_SETTINGS: AmbienceSettings = { sound: "off", volume: AMBIENCE_CONFIG.defaultVolume };

/**
 * 저장된 글자를 설정으로. 망가졌거나 없으면 기본값(끔, 음량 0.5).
 * @example parseSettings('{"sound":"rain","volume":0.3}') // { sound: "rain", volume: 0.3 }
 */
export function parseSettings(raw: string | null | undefined): AmbienceSettings {
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const value = JSON.parse(raw) as Partial<AmbienceSettings>;
    const sound = AMBIENCE_SOUNDS.some((s) => s.id === value.sound) ? (value.sound as AmbienceSound) : "off";
    const volume = typeof value.volume === "number" && Number.isFinite(value.volume) ? clampVolume(value.volume) : DEFAULT_SETTINGS.volume;
    return { sound, volume };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** 음량을 0~1로 자른다. */
export const clampVolume = (volume: number) => Math.min(1, Math.max(0, volume));

/**
 * 귀에 고르게 들리도록 음량(0~1)을 이득으로 바꾼다 (제곱 곡선).
 * @example perceptualGain(0.5) // 0.25
 */
export const perceptualGain = (volume: number) => clampVolume(volume) ** 2;

/** 키 하나: 앞 키에서 몇 초 뒤에, 어떤 키인지. */
export interface Keystroke {
  gap: number;
  kind: "key" | "space" | "enter";
  /** 0~1 세기 */
  velocity: number;
}

/**
 * 사람이 치는 것 같은 타자 박자를 만든다: 단어마다 3~8타(0.08~0.17초 간격), 단어 사이 띄어쓰기,
 * 가끔 줄바꿈과 생각하는 쉼(0.8~2.4초). rng는 0~1 난수 함수 (시험에서는 고정 수열).
 * @example const typist = createTypist(Math.random); const k = typist(); // { gap: 0.12, kind: "key", velocity: 0.8 }
 */
export function createTypist(rng: () => number): () => Keystroke {
  const between = (a: number, b: number) => a + (b - a) * rng();
  const word = () => Math.round(between(3, 8));
  let left = word();
  let pause = false;
  return () => {
    if (pause) {
      // 쉼 뒤 첫 키도 새 단어의 한 타다
      pause = false;
      left = word() - 1;
      return { gap: between(0.8, 2.4), kind: "key", velocity: between(0.6, 1) };
    }
    if (left <= 0) {
      left = word();
      // 단어 끝: 대개 띄어쓰기, 가끔 줄바꿈 뒤 쉼
      if (rng() < 0.12) {
        pause = true;
        return { gap: between(0.12, 0.22), kind: "enter", velocity: between(0.8, 1) };
      }
      return { gap: between(0.1, 0.2), kind: "space", velocity: between(0.6, 0.9) };
    }
    left--;
    return { gap: between(0.08, 0.17), kind: "key", velocity: between(0.5, 1) };
  };
}

/**
 * 디코딩한 녹음 앞의 무음(인코더 지연)을 건너뛸 첫 칸. 소리가 시작하는 칸이고, 최대 0.1초까지만 본다.
 * @example findLoopStart(new Float32Array([0, 0, 0.2]), 44100) // 2
 */
export function findLoopStart(samples: Float32Array, sampleRate: number, threshold = 1e-4): number {
  const limit = Math.min(samples.length, Math.round(sampleRate * 0.1));
  for (let i = 0; i < limit; i++) if (Math.abs(samples[i]) > threshold) return i;
  return 0;
}
