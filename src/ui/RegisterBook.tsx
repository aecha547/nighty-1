import { useRef } from "react";
import { useModal } from "./useModal";

export interface RegisterRow {
  night?: string;
  who?: string;
  text?: string;
  inn?: string;
  out?: string;
  hl?: boolean;
  note?: string;
}

/** The Caretaker's visitor register. Objective arrivals and departures only. */
export function RegisterBook({ rows, onClose, title = "Visitor register" }: { rows: RegisterRow[]; onClose: () => void; title?: string }) {
  const close = useRef<HTMLButtonElement>(null);
  const modal = useModal(onClose);
  return (
    <div ref={modal} className="book-wrap" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="book" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {rows.map((r, i) =>
          r.note ? (
            <div key={i} className="book-row note">{r.note}</div>
          ) : (
            <div key={i} className={`book-row ${r.hl ? "hl" : ""}`}>
              <span className="who">{r.who}</span>
              <span>{r.night}</span>
              <span className="t">{r.inn ? `in ${r.inn}` : ""}</span>
              <span className="t t2">{r.out ? `out ${r.out}` : ""}</span>
            </div>
          )
        )}
        <button ref={close} className="book-close" onClick={onClose}>close the book</button>
      </div>
    </div>
  );
}
