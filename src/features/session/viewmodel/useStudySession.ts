import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useSession } from "../../account/viewmodel/SessionContext";
import { SESSION_CONFIG } from "../model/sessionConfig";
import { SessionTakenError, type SessionSnapshot } from "../model/session";
import { sessionStore } from "../model/sessionStore";
import {
  dayStartOf,
  initialSessionState,
  serverStateOf,
  sessionReducer,
  todaySeconds,
  type ServerState,
  type SessionEvent,
} from "../model/sessionMachine";

/** connecting: 세션을 가져오는 중, ready: 이 탭이 세션 주인, taken: 다른 곳이 넘겨받음. */
export type SessionLink = "connecting" | "ready" | "taken" | "error";

const config = SESSION_CONFIG;
const reducer = (state: ReturnType<typeof initialSessionState>, event: SessionEvent) =>
  sessionReducer(state, event, config);

const newTabId = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

const NOTICE_TEXT = {
  checkIn: "60분째 집중하고 있어요. 계속할까요?",
  pomodoroEnd: "뽀모도로 공부 시간이 끝났어요. 잠깐 쉬어 가요.",
} as const;

/**
 * 회사 방의 공부 세션 (Story 002). 캐릭터 동작을 받아 상태 기계를 돌리고, 바뀐 상태를 서버에 보낸다.
 * 화면 시계는 서버 시각 기준이다 (세션을 가져올 때 받은 서버 시각과의 차이를 보정).
 * @example const study = useStudySession(); study.reportActivity(character.activity);
 */
export function useStudySession() {
  const userId = useSession()?.user.id;
  const tabId = useRef(newTabId()).current;
  const offset = useRef(0);
  const clock = useCallback(() => Date.now() + offset.current, []);
  const [machine, dispatch] = useReducer(reducer, undefined, () => initialSessionState(Date.now()));
  const [link, setLink] = useState<SessionLink>("connecting");
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [beat, setBeat] = useState(0);
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const sent = useRef<ServerState | null>(null);
  const linkRef = useRef(link);
  linkRef.current = link;

  /** 서버 호출을 하나씩 순서대로 보낸다. 넘겨받았으면 더 보내지 않는다. */
  const enqueue = useCallback((run: () => Promise<SessionSnapshot>) => {
    const next = chain.current.then(async () => {
      if (linkRef.current === "taken") return;
      try {
        setSnapshot(await run());
      } catch (e) {
        if (e instanceof SessionTakenError) setLink("taken");
        else throw e;
      }
    });
    chain.current = next.catch(() => undefined);
    return next;
  }, []);

  const claim = useCallback(() => {
    setLink("connecting");
    linkRef.current = "connecting";
    const next = chain.current.then(async () => {
      try {
        const snap = await sessionStore.claim(tabId);
        offset.current = snap.serverNow - Date.now();
        sent.current = "break";
        setSnapshot(snap);
        setLink("ready");
      } catch {
        setLink("error");
      }
    });
    chain.current = next;
  }, [tabId]);

  useEffect(() => {
    if (!userId) return;
    claim();
    const stop = sessionStore.watchOwner(userId, (owner) => {
      if (owner !== tabId) setLink("taken");
    });
    return () => {
      stop();
      if (linkRef.current === "ready" && sent.current !== "left") {
        sent.current = "left";
        void enqueue(() => sessionStore.setState(tabId, "left")).catch(() => undefined);
      }
    };
  }, [userId, tabId, claim, enqueue]);

  const desired = serverStateOf(machine);
  useEffect(() => {
    if (link !== "ready" || desired === sent.current) return;
    sent.current = desired;
    const awayAt = machine.awaySince;
    enqueue(() =>
      desired === "away" && awayAt !== null
        ? sessionStore.markAway(tabId, awayAt)
        : sessionStore.setState(tabId, desired === "away" ? "break" : desired),
    ).catch(() => {
      // 실패하면 다음 연결 확인 때 다시 보낸다.
      sent.current = null;
    });
  }, [link, desired, beat, machine.awaySince, tabId, enqueue]);

  useEffect(() => {
    if (link !== "ready") return;
    const id = window.setInterval(() => {
      void enqueue(() => sessionStore.heartbeat(tabId))
        .catch(() => undefined)
        .finally(() => setBeat((b) => b + 1));
    }, config.heartbeatMs);
    return () => window.clearInterval(id);
  }, [link, tabId, enqueue]);

  useEffect(() => {
    if (link === "taken") return;
    const id = window.setInterval(() => {
      const t = clock();
      dispatch({ type: "tick", now: t });
      setNow(t);
    }, 1000);
    return () => window.clearInterval(id);
  }, [link, clock]);

  useEffect(() => {
    let lastInput = 0;
    const onInput = () => {
      const t = clock();
      if (t - lastInput < config.inputThrottleMs) return;
      lastInput = t;
      dispatch({ type: "input", now: t });
    };
    const events = ["pointermove", "pointerdown", "keydown", "wheel"] as const;
    events.forEach((name) => window.addEventListener(name, onInput, { passive: true }));
    return () => events.forEach((name) => window.removeEventListener(name, onInput));
  }, [clock]);

  // 탭이 뒤에 있고 사용자가 허용했을 때만 브라우저 알림을 보낸다.
  const promptKind = machine.prompt?.kind;
  useEffect(() => {
    if (!promptKind || !document.hidden) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    new Notification("모여공부", { body: NOTICE_TEXT[promptKind] });
  }, [promptKind, machine.prompt?.shownAt]);

  const [permission, setPermission] = useState(() =>
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );

  const reportActivity = useCallback(
    (activity: string) => {
      const t = clock();
      if (activity === "seated") dispatch({ type: "seat", now: t });
      else if (activity === "exiting") dispatch({ type: "leave", now: t });
      else dispatch({ type: "unseat", now: t });
    },
    [clock],
  );

  const sameDay = snapshot && dayStartOf(snapshot.serverNow, config) === dayStartOf(now, config);
  const seconds = snapshot
    ? todaySeconds(
        {
          closedSeconds: sameDay ? snapshot.closedSeconds : 0,
          openSince: desired === "studying" ? (snapshot.openSince ?? null) : null,
        },
        now,
        config,
      )
    : 0;

  return {
    link,
    state: desired,
    todaySeconds: seconds,
    prompt: machine.prompt,
    promptText: machine.prompt ? NOTICE_TEXT[machine.prompt.kind] : "",
    pomodoro: machine.pomodoro
      ? {
          phase: machine.pomodoro.phase,
          remainingMs: Math.max(0, machine.pomodoro.phaseEndsAt - now),
          studyMinutes: machine.pomodoro.studyMs / 60_000,
          breakMinutes: machine.pomodoro.breakMs / 60_000,
        }
      : null,
    notificationPermission: permission,
    reportActivity,
    respond: () => dispatch({ type: "respond", now: clock() }),
    startPomodoro: (studyMinutes: number, breakMinutes: number) =>
      dispatch({ type: "startPomodoro", now: clock(), studyMinutes, breakMinutes }),
    stopPomodoro: () => dispatch({ type: "stopPomodoro", now: clock() }),
    takeBack: claim,
    requestNotifications: async () => {
      if (typeof Notification === "undefined") return;
      setPermission(await Notification.requestPermission());
    },
  };
}

export type StudySession = ReturnType<typeof useStudySession>;
