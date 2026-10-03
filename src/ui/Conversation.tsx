import { useCallback, useEffect, useRef, useState } from "react";
import { storyTimeout } from "../lib/pause";

export type Beat = { who?: string; text: string; silence?: never } | { silence: number; text?: string; who?: never };

/**
 * Click / tap / Space / Enter to continue. Silences advance on their own.
 * Pacing belongs to the person reading: nothing here is timed against them.
 */
export function Conversation({
  beats,
  onDone,
  onBeat,
  hint = "continue"
}: {
  beats: Beat[];
  onDone: () => void;
  onBeat?: (index: number, beat: Beat) => void;
  hint?: string;
}) {
  const [i, setI] = useState(0);
  const [fade, setFade] = useState(false);
  const ready = useRef(false);
  const done = useRef(false);
  const changing = useRef(false);
  const changeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const btn = useRef<HTMLButtonElement>(null);
  const beat = beats[Math.min(i, beats.length - 1)];

  useEffect(() => {
    document.body.dataset.convo = "1";
    btn.current?.focus({ preventScroll: true });
    return () => {
      delete document.body.dataset.convo;
      clearTimeout(changeTimer.current);
    };
  }, []);

  useEffect(() => {
    ready.current = false;
    changing.current = false;
    onBeat?.(i, beats[i]);
    const cancel = storyTimeout(() => (ready.current = true), 650);
    let cancelAuto = () => {};
    if ("silence" in beats[i] && typeof beats[i].silence === "number") {
      cancelAuto = storyTimeout(() => advance(), (beats[i].silence as number) * 1000);
    }
    return () => {
      cancel();
      cancelAuto();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const advance = useCallback(() => {
    if (done.current || changing.current) return;
    changing.current = true;
    ready.current = false;
    if (i >= beats.length - 1) {
      done.current = true;
      onDone();
      return;
    }
    setFade(true);
    changeTimer.current = setTimeout(() => {
      setI((n) => n + 1);
      setFade(false);
    }, 380);
  }, [i, beats.length, onDone]);

  const click = () => {
    if (!ready.current || "silence" in beat) return;
    advance();
  };

  const isSilence = "silence" in beat && typeof beat.silence === "number";
  return (
    <button ref={btn} type="button" className="convo" onClick={click} aria-live="polite">
      {isSilence ? (
        <div className={`convo-silence ${fade ? "fade" : ""}`}>{beat.text ?? "…"}</div>
      ) : (
        <>
          {beat.who && <div className="convo-who">{beat.who}</div>}
          <div className={`convo-text ${fade ? "fade" : ""}`}>{beat.text}</div>
        </>
      )}
      <div className="convo-hint">{isSilence ? "" : hint}</div>
    </button>
  );
}
