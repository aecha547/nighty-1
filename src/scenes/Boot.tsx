export function Boot({ onEnter }: { onEnter: () => void }) {
  return (
    <main className="screen">
      <section className="boot-card">
        <div className="boot-kicker">night archive · five recordings</div>
        <h1 className="boot-title">
          THE GARDEN
          <br />
          THE NIGHT KEPT
        </h1>
        <p className="boot-sub">Nothing here asks the past to change.</p>
        <button className="btn" onClick={onEnter} autoFocus>
          enter the archive
        </button>
        <div className="boot-note">best with sound · headphones if you can</div>
      </section>
    </main>
  );
}

export function Resume({ onContinue, onRestart, finished }: { onContinue: () => void; onRestart: () => void; finished: boolean }) {
  return (
    <main className="screen">
      <section className="boot-card">
        <div className="boot-kicker">the archive remembers</div>
        <h1 className="boot-title">
          THE GARDEN
          <br />
          THE NIGHT KEPT
        </h1>
        <p className="boot-sub">{finished ? "The night is over. The garden is open." : "A recording was left unfinished."}</p>
        <div className="btn-row">
          <button className="btn" onClick={onContinue} autoFocus>
            {finished ? "return to the garden" : "continue"}
          </button>
          <button className="btn quiet" onClick={onRestart}>
            begin again
          </button>
        </div>
      </section>
    </main>
  );
}
