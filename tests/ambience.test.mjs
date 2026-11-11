import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";
import {
  AMBIENCE_CONFIG,
  createTypist,
  findLoopStart,
  parseSettings,
  perceptualGain,
} from "../src/features/ambience/model/ambienceRules.ts";
import { mockSupabase } from "./supabaseMock.mjs";

// Story 012: 공부방 백색소음. 규칙은 순수 함수로, 화면은 실제 브라우저 오디오로 확인한다.
const url = process.env.APP_URL || "http://127.0.0.1:4173/";
const evidence = "production/qa/evidence/story-012-ambience";

/** 시험용 고정 난수 (mulberry32). */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test("저장된 설정: 망가졌거나 모르는 값이면 기본값(끔, 음량 0.5), 음량은 0~1로 자른다", () => {
  assert.deepEqual(parseSettings(null), { sound: "off", volume: AMBIENCE_CONFIG.defaultVolume });
  assert.deepEqual(parseSettings("{망가짐"), { sound: "off", volume: AMBIENCE_CONFIG.defaultVolume });
  assert.deepEqual(parseSettings('{"sound":"thunder","volume":0.3}'), { sound: "off", volume: 0.3 });
  assert.deepEqual(parseSettings('{"sound":"cafe","volume":7}'), { sound: "cafe", volume: 1 });
  assert.deepEqual(parseSettings('{"sound":"rain","volume":"크게"}'), { sound: "rain", volume: AMBIENCE_CONFIG.defaultVolume });
});

test("음량은 제곱 곡선으로 이득이 된다", () => {
  assert.equal(perceptualGain(0), 0);
  assert.equal(perceptualGain(0.5), 0.25);
  assert.equal(perceptualGain(1), 1);
  assert.equal(perceptualGain(2), 1);
});

test("타자 박자: 단어 안 키 간격은 0.08~0.17초, 단어 사이에 띄어쓰기, 가끔 줄바꿈 뒤 0.8~2.4초 쉼", () => {
  // Arrange
  const typist = createTypist(seeded(12));
  // Act
  const keys = Array.from({ length: 2000 }, () => typist());
  // Assert
  const kinds = new Set(keys.map((k) => k.kind));
  assert.deepEqual([...kinds].sort(), ["enter", "key", "space"]);
  let run = 0;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    assert.ok(k.velocity >= 0.5 && k.velocity <= 1, `세기 ${k.velocity}`);
    if (k.kind === "key") {
      run++;
      const afterEnter = i > 0 && keys[i - 1].kind === "enter";
      const [lo, hi] = afterEnter ? [0.8, 2.4] : [0.08, 0.17];
      assert.ok(k.gap >= lo && k.gap <= hi, `키 간격 ${k.gap} (${afterEnter ? "쉼 뒤" : "단어 안"})`);
    } else {
      assert.ok(run >= 3 && run <= 8, `단어 길이 ${run}`);
      run = 0;
    }
  }
  const total = keys.reduce((s, k) => s + k.gap, 0);
  // 분당 타수가 사람 범위(대략 150~400타)
  const perMinute = (keys.length / total) * 60;
  assert.ok(perMinute > 150 && perMinute < 400, `분당 ${perMinute.toFixed(0)}타`);
});

test("녹음 앞 무음은 건너뛰되 0.1초 넘게는 보지 않는다", () => {
  assert.equal(findLoopStart(new Float32Array([0, 0, 0.00005, 0.2, 0.1]), 44100), 3);
  assert.equal(findLoopStart(new Float32Array([0.3, 0]), 44100), 0);
  assert.equal(findLoopStart(new Float32Array(10), 44100), 0);
  assert.equal(findLoopStart(new Float32Array(100), 100), 0);
});

test("방 소리: 빗소리, 키보드, 카페를 고르고 음량을 바꾸면 이 브라우저에 기억해 다시 들어와도 켜진다", async () => {
  await mkdir(evidence, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  });
  try {
    // Arrange: 회사 방에 출근한다.
    const page = await (await browser.newContext({ viewport: { width: 1536, height: 1024 } })).newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await mockSupabase(page);
    await page.goto(url);
    await page.getByRole("button", { name: / 방으로 출근$/ }).first().click();
    await page.getByTestId("movement-status").filter({ hasText: "출입구에 도착" }).waitFor({ timeout: 20000 });
    const control = page.getByTestId("ambience");
    assert.equal(await control.getAttribute("data-sound"), "off");

    // Act: 소리 창을 열고 빗소리를 고른 뒤 음량을 30으로.
    await page.getByRole("button", { name: "방 소리", exact: true }).click();
    const panel = page.getByRole("dialog", { name: "방 소리" });
    await panel.getByRole("button", { name: "빗소리", exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-testid="ambience"]')?.dataset.sound === "rain");
    await panel.getByRole("slider").fill("30");
    await shot(page, "ambience-panel-rain.png");
    await panel.getByRole("button", { name: "키보드", exact: true }).click();
    await panel.getByRole("button", { name: "카페", exact: true }).click();

    // Assert: 카페 녹음 파일을 받아 풀었고 오류가 없다. 고른 것과 음량을 기억한다.
    await page.waitForFunction(() => document.querySelector('[data-testid="ambience"]')?.dataset.sound === "cafe");
    assert.equal(await panel.getByRole("alert").count(), 0);
    const decoded = await page.evaluate(async (src) => {
      const ctx = new AudioContext();
      const buffer = await ctx.decodeAudioData(await (await fetch(src)).arrayBuffer());
      await ctx.close();
      return { duration: buffer.duration, channels: buffer.numberOfChannels };
    }, AMBIENCE_CONFIG.cafeUrl);
    assert.ok(decoded.duration >= AMBIENCE_CONFIG.cafeLoopSeconds && decoded.duration < AMBIENCE_CONFIG.cafeLoopSeconds + 0.2, `길이 ${decoded.duration}`);
    assert.equal(decoded.channels, 2);
    const saved = JSON.parse(await page.evaluate((key) => localStorage.getItem(key), AMBIENCE_CONFIG.storageKey));
    assert.deepEqual(saved, { sound: "cafe", volume: 0.3 });
    // 바깥을 누르면 창이 닫힌다.
    await page.mouse.click(5, 300);
    await panel.waitFor({ state: "detached" });
    await page.reload();
    await page.getByTestId("movement-status").filter({ hasText: "출입구에 도착" }).waitFor({ timeout: 20000 });
    await page.waitForFunction(() => document.querySelector('[data-testid="ambience"]')?.dataset.sound === "cafe");
    assert.match(await page.getByRole("button", { name: "방 소리, 카페", exact: true }).innerText(), /카페/);
    await shot(page, "ambience-on.png");
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test("세 소리의 크기가 비슷하고 깨지지 않는다 (OfflineAudioContext로 6초를 미리 그려 잰다)", async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    // Arrange: 개발 서버가 주는 엔진 모듈을 고정 난수로 쓴다.
    const page = await browser.newPage();
    await page.goto(new URL("/login", url).href);
    // Act
    const levels = await page.evaluate(async () => {
      const { createAmbienceEngine } = await import("/src/features/ambience/model/ambienceEngine.ts");
      let a = 7;
      const rng = () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      const result = {};
      for (const sound of ["rain", "keyboard", "cafe"]) {
        const off = new OfflineAudioContext(2, 44100 * 6, 44100);
        const engine = createAmbienceEngine({ context: () => off, lookahead: 6, volume: 1, rng });
        await engine.play(sound);
        const buffer = await off.startRendering();
        engine.close();
        let sum = 0, peak = 0, n = 0;
        for (let c = 0; c < 2; c++) {
          const d = buffer.getChannelData(c);
          // 켜지는 0.6초가 지난 뒤부터
          for (let i = 44100 * 1.5; i < d.length; i++) {
            sum += d[i] * d[i];
            peak = Math.max(peak, Math.abs(d[i]));
            n++;
          }
        }
        result[sound] = { rmsDb: 10 * Math.log10(sum / n), peak };
      }
      return result;
    });
    // Assert: 모두 들리고(-34 dBFS 위), 크지 않고(-20 아래), 깨지지 않는다. 빗소리와 카페는 4 dB 안.
    for (const [sound, { rmsDb, peak }] of Object.entries(levels)) {
      assert.ok(rmsDb > -34 && rmsDb < -20, `${sound} ${rmsDb.toFixed(1)} dBFS`);
      assert.ok(peak < 0.9, `${sound} 최고 ${peak.toFixed(2)}`);
    }
    assert.ok(Math.abs(levels.rain.rmsDb - levels.cafe.rmsDb) < 4, JSON.stringify(levels));
  } finally {
    await browser.close();
  }
});

const shot = (page, name) => page.screenshot({ path: `${evidence}/${name}`, fullPage: true });
