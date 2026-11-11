import { AMBIENCE_CONFIG, createTypist, findLoopStart, perceptualGain, type AmbienceSound, type Keystroke } from "./ambienceRules";

/**
 * 방 백색소음을 Web Audio로 낸다 (Story 012).
 * 빗소리: 분홍 잡음(창밖 빗줄기)과 무작위 빗방울. 키보드: 사람 박자의 타자 소리와 아주 작은 방 소리.
 * 카페: CC0 녹음 60초를 끊김 없이 되풀이 (파일은 카페를 고를 때 처음 받는다).
 * 브라우저가 아직 소리를 막고 있으면(화면을 한 번도 누르지 않음) 첫 누름이나 키 입력 때 켠다.
 */
export interface AmbienceEngine {
  /** 소리를 바꾼다. off면 멈춘다. 소리가 나고 있으면 true, 브라우저가 막아 첫 입력을 기다리면 false. */
  play(sound: AmbienceSound): Promise<boolean>;
  /** 0~1 */
  setVolume(volume: number): void;
  /** 모두 멈추고 오디오를 닫는다. 방을 나갈 때. */
  close(): void;
}

interface Voice {
  stop(): void;
}

type Ctor = typeof AudioContext;

/** 시험에서 바꿔 끼울 수 있는 것: 난수, 카페 파일 주소, 오디오 문맥(OfflineAudioContext로 미리 그려 소리 크기를 잰다), 미리 짜 두는 시간. */
export interface AmbienceEngineOptions {
  rng?: () => number;
  cafeUrl?: string;
  volume?: number;
  context?: () => BaseAudioContext;
  lookahead?: number;
}

export function createAmbienceEngine(options: AmbienceEngineOptions = {}): AmbienceEngine {
  const rng = options.rng ?? Math.random;
  const cafeUrl = options.cafeUrl ?? AMBIENCE_CONFIG.cafeUrl;
  const fade = AMBIENCE_CONFIG.fadeSeconds;
  let volume = options.volume ?? AMBIENCE_CONFIG.defaultVolume;
  let ctx: BaseAudioContext | null = null;
  let master: GainNode | null = null;
  let voice: Voice | null = null;
  let order = 0;
  let closed = false;
  let cafeBuffer: Promise<AudioBuffer> | null = null;
  const between = (a: number, b: number) => a + (b - a) * rng();

  /** 소리를 내는 문맥인지 (OfflineAudioContext에는 close가 없다). webkitAudioContext만 있는 브라우저도 있어 instanceof를 쓰지 않는다. */
  const isLive = (ac: BaseAudioContext): ac is AudioContext => typeof (ac as Partial<AudioContext>).close === "function";
  const resume = (ac: BaseAudioContext) => (isLive(ac) ? ac.resume().catch(() => undefined) : Promise.resolve());
  const unlock = () => void (ctx && resume(ctx));
  const open = () => {
    if (!ctx) {
      const AudioCtor: Ctor | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
      if (!AudioCtor && !options.context) throw new Error("no_audio");
      ctx = options.context ? options.context() : new AudioCtor!();
      master = ctx.createGain();
      master.gain.value = perceptualGain(volume);
      master.connect(ctx.destination);
      window.addEventListener("pointerdown", unlock, true);
      window.addEventListener("keydown", unlock, true);
    }
    return { ctx, master: master! };
  };

  /** 이어 붙여도 이음매가 들리지 않는 잡음 (끝을 앞과 겹쳐 섞는다). */
  const noise = (ac: BaseAudioContext, seconds: number, color: "white" | "pink" | "brown", channels = 2) => {
    const length = Math.round(ac.sampleRate * seconds);
    const overlap = Math.min(Math.round(ac.sampleRate * 0.05), Math.floor(length / 4));
    const buffer = ac.createBuffer(channels, length, ac.sampleRate);
    for (let c = 0; c < channels; c++) {
      const raw = new Float32Array(length + overlap);
      let b0 = 0, b1 = 0, b2 = 0, brown = 0;
      for (let i = 0; i < raw.length; i++) {
        const w = rng() * 2 - 1;
        if (color === "white") raw[i] = w;
        else if (color === "pink") {
          b0 = 0.99765 * b0 + w * 0.099046;
          b1 = 0.963 * b1 + w * 0.2965164;
          b2 = 0.57 * b2 + w * 1.0526913;
          raw[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
        } else {
          brown = (brown + 0.02 * w) / 1.02;
          raw[i] = brown * 3.5;
        }
      }
      const out = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) {
        const t = i < overlap ? i / overlap : 1;
        out[i] = i < overlap ? raw[i] * t + raw[length + i] * (1 - t) : raw[i];
      }
    }
    return buffer;
  };

  /** 소리 하나의 바깥 이득: 서서히 켜고, 멈출 때 서서히 끈 뒤 정리한다. */
  const voiceOut = (ac: BaseAudioContext, out: AudioNode) => {
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(1, ac.currentTime + fade);
    gain.connect(out);
    const sources: AudioScheduledSourceNode[] = [];
    let timer = 0;
    return {
      gain,
      keep: (s: AudioScheduledSourceNode) => sources.push(s),
      /** 미리 짜 두는 일정. 숨은 탭은 타이머가 느리므로 더 멀리 짜 둔다. */
      schedule(plan: (until: number) => void) {
        const tick = () => {
          const ahead = options.lookahead ?? (document.hidden ? AMBIENCE_CONFIG.lookaheadSeconds.hidden : AMBIENCE_CONFIG.lookaheadSeconds.visible);
          plan(ac.currentTime + ahead);
        };
        tick();
        timer = window.setInterval(tick, 100);
      },
      stop() {
        window.clearInterval(timer);
        const now = ac.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + fade);
        window.setTimeout(() => {
          for (const s of sources) {
            try {
              s.stop();
            } catch {
              // 이미 멈췄다
            }
          }
          gain.disconnect();
        }, fade * 1000 + 100);
      },
    };
  };

  /** 짧은 잡음 한 번 (빗방울, 키 소리). */
  const burst = (
    ac: BaseAudioContext,
    out: AudioNode,
    source: AudioBuffer,
    at: number,
    { freq, q, peak, decay, pan }: { freq: number; q: number; peak: number; decay: number; pan: number },
  ) => {
    const src = ac.createBufferSource();
    src.buffer = source;
    const filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = q;
    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    src.connect(filter).connect(env);
    if (ac.createStereoPanner) {
      const panner = ac.createStereoPanner();
      panner.pan.value = pan;
      env.connect(panner).connect(out);
    } else env.connect(out);
    src.start(at, rng() * Math.max(0, source.duration - decay - 0.01));
    src.stop(at + decay + 0.01);
  };

  const rain = (ac: BaseAudioContext, out: AudioNode): Voice => {
    const v = voiceOut(ac, out);
    const bed = ac.createBufferSource();
    bed.buffer = noise(ac, 8, "pink");
    bed.loop = true;
    const high = ac.createBiquadFilter();
    high.type = "highpass";
    high.frequency.value = 350;
    const low = ac.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 2600;
    low.Q.value = 0.5;
    const bedGain = ac.createGain();
    bedGain.gain.value = 0.24;
    // 바람에 빗줄기가 조금씩 세졌다 약해진다
    const gust = ac.createOscillator();
    gust.frequency.value = 0.07;
    const gustDepth = ac.createGain();
    gustDepth.gain.value = 0.05;
    gust.connect(gustDepth).connect(bedGain.gain);
    bed.connect(high).connect(low).connect(bedGain).connect(v.gain);
    bed.start();
    gust.start();
    v.keep(bed);
    v.keep(gust);
    const drop = noise(ac, 0.3, "white", 1);
    let next = ac.currentTime + 0.1;
    v.schedule((until) => {
      if (next < ac.currentTime) next = ac.currentTime + 0.05;
      while (next < until) {
        burst(ac, v.gain, drop, next, { freq: between(1800, 5200), q: between(6, 12), peak: between(0.03, 0.09), decay: between(0.03, 0.07), pan: between(-0.8, 0.8) });
        next += -Math.log(1 - rng() * 0.999) / AMBIENCE_CONFIG.dripsPerSecond;
      }
    });
    return v;
  };

  const keyboard = (ac: BaseAudioContext, out: AudioNode): Voice => {
    const v = voiceOut(ac, out);
    // 아주 작은 방 소리: 타자 사이가 텅 비지 않게
    const room = ac.createBufferSource();
    room.buffer = noise(ac, 6, "brown");
    room.loop = true;
    const roomLow = ac.createBiquadFilter();
    roomLow.type = "lowpass";
    roomLow.frequency.value = 420;
    const roomGain = ac.createGain();
    roomGain.gain.value = 0.12;
    room.connect(roomLow).connect(roomGain).connect(v.gain);
    room.start();
    v.keep(room);
    const click = noise(ac, 0.3, "white", 1);
    const typist = createTypist(rng);
    const press = (at: number, key: Keystroke) => {
      const tone = key.kind === "space" ? 1500 : key.kind === "enter" ? 2100 : between(2600, 3800);
      const pan = key.kind === "space" ? 0 : between(-0.25, 0.25);
      burst(ac, v.gain, click, at, { freq: tone, q: 1.4, peak: 0.75 * key.velocity, decay: key.kind === "key" ? 0.016 : 0.028, pan });
      // 키가 바닥에 닿는 낮은 소리
      const thock = ac.createOscillator();
      thock.type = "triangle";
      thock.frequency.value = key.kind === "space" ? 95 : key.kind === "enter" ? 115 : between(140, 180);
      const env = ac.createGain();
      env.gain.setValueAtTime(0.0001, at);
      env.gain.exponentialRampToValueAtTime(0.38 * key.velocity, at + 0.003);
      env.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
      thock.connect(env).connect(v.gain);
      thock.start(at);
      thock.stop(at + 0.05);
      // 키를 놓는 작은 소리
      burst(ac, v.gain, click, at + between(0.06, 0.09), { freq: tone * 1.2, q: 1.6, peak: 0.22 * key.velocity, decay: 0.01, pan });
    };
    let next = ac.currentTime + 0.3;
    v.schedule((until) => {
      if (next < ac.currentTime) next = ac.currentTime + 0.1;
      while (next < until) {
        const key = typist();
        next += key.gap;
        press(next, key);
      }
    });
    return v;
  };

  const cafe = async (ac: BaseAudioContext, out: AudioNode): Promise<Voice> => {
    cafeBuffer ??= fetch(cafeUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`cafe_sound_${r.status}`);
        return r.arrayBuffer();
      })
      .then((data) => ac.decodeAudioData(data));
    let buffer: AudioBuffer;
    try {
      buffer = await cafeBuffer;
    } catch (e) {
      cafeBuffer = null;
      throw e;
    }
    const v = voiceOut(ac, out);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const start = findLoopStart(buffer.getChannelData(0), buffer.sampleRate) / buffer.sampleRate;
    src.loopStart = start;
    src.loopEnd = Math.min(buffer.duration, start + AMBIENCE_CONFIG.cafeLoopSeconds);
    src.connect(v.gain);
    src.start(ac.currentTime, start);
    v.keep(src);
    return v;
  };

  return {
    async play(sound) {
      const mine = ++order;
      voice?.stop();
      voice = null;
      if (sound === "off" || closed) return false;
      const { ctx: ac, master: out } = open();
      if (ac.state === "suspended") await resume(ac);
      const next = sound === "rain" ? rain(ac, out) : sound === "keyboard" ? keyboard(ac, out) : await cafe(ac, out);
      if (mine !== order || closed) {
        next.stop();
        return false;
      }
      voice = next;
      return ac.state === "running";
    },
    setVolume(value) {
      volume = value;
      if (ctx && master) master.gain.setTargetAtTime(perceptualGain(value), ctx.currentTime, 0.05);
    },
    close() {
      closed = true;
      order++;
      voice?.stop();
      voice = null;
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      const ac = ctx;
      ctx = null;
      master = null;
      if (ac && isLive(ac)) window.setTimeout(() => void ac.close().catch(() => undefined), fade * 1000 + 150);
    },
  };
}
