"""공용 카페 소리 되풀이 파일을 만든다 (Story 012).

사용법:
    python -m pip install --target <임시 폴더> soundfile
    PYTHONPATH=<임시 폴더> python tools/audio/cafe_loop.py <Cafe_ambiance.ogg> public/assets/sounds

원본: Wikimedia Commons "File:Cafe ambiance.ogg" (Marble Toast, CC0, 20분, 44.1 kHz 스테레오).
1초 창으로 소리 크기를 재서 크기 변화가 가장 작고 튀는 소리가 적은 63초를 고르고,
뒤 3초를 앞 3초와 같은 힘으로 겹쳐(equal-power) 60초 고리를 만든 뒤 RMS -23 dBFS로 맞춰 MP3로 쓴다.
브라우저는 src/features/ambience/model/ambienceEngine.ts가 앞 무음(인코더 지연)을 건너뛰고 60초를 되풀이한다.
"""
import sys

import numpy as np
import soundfile as sf

LOOP_SECONDS = 60
CROSSFADE_SECONDS = 3
TARGET_RMS_DB = -23


def main(src: str, out_dir: str) -> None:
    data, sr = sf.read(src, dtype="float32", always_2d=True)
    mono = data.mean(axis=1)
    n = len(mono) // sr
    windows = mono[: n * sr].reshape(n, sr)
    rms = np.sqrt((windows**2).mean(axis=1))
    peak = np.abs(windows).max(axis=1)
    db = 20 * np.log10(rms + 1e-9)
    span = LOOP_SECONDS + CROSSFADE_SECONDS
    best = None
    # 앞뒤 30초는 녹음을 켜고 끄는 소리가 있을 수 있어 뺀다.
    for s in range(30, n - span - 30):
        crest = (peak[s : s + span] / (rms[s : s + span] + 1e-9)).max()
        score = db[s : s + span].std() + 0.15 * max(0, crest - 6)
        if best is None or score < best[0]:
            best = (score, s)
    start = best[1] * sr
    print("start", best[1], "s")
    seg = data[start : start + span * sr]
    body = seg[: LOOP_SECONDS * sr].copy()
    tail = seg[LOOP_SECONDS * sr :]
    t = np.linspace(0, 1, CROSSFADE_SECONDS * sr, dtype=np.float32)[:, None]
    body[: CROSSFADE_SECONDS * sr] = body[: CROSSFADE_SECONDS * sr] * np.sqrt(t) + tail * np.sqrt(1 - t)
    body *= 10 ** (TARGET_RMS_DB / 20) / np.sqrt((body**2).mean())
    body = np.clip(body, -0.98, 0.98)
    sf.write(f"{out_dir}/cafe-loop.mp3", body, sr, format="MP3", subtype="MPEG_LAYER_III", compression_level=0.6)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
