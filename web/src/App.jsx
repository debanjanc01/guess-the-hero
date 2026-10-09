import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowRight, ArrowLeft, ArrowUpRight, Swords, Volume2, VolumeX, Trophy, SkipForward, Check, BookOpen, Shield, Sparkles, Search, RotateCcw, Flag, ChevronRight, Info } from 'lucide-react';
import { Button, Input, Modal } from './components/ui.jsx';
import HeroOrbit from './components/HeroOrbit.jsx';
import useGameViewport from './useGameViewport.js';
import heroes from './data/heroes.json';
import { MODES, createAnswerBook, poolFor, startGame, transition, artwork, normalize, readSaved, writeSaved } from './game.js';

const base = import.meta.env.BASE_URL;
const asset = (path) => base + path;
const answers = createAnswerBook(heroes);
const counts = {};
for (const mode in MODES) counts[mode] = poolFor(heroes, mode).length;
const storage = { getItem: (key) => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) };
const demoIds = ['juggernaut', 'crystal_maiden', 'nevermore', 'pudge', 'kez', 'largo'];
const showcaseRoster = [];
const featured = { juggernaut: true, nevermore: true, axe: true, crystal_maiden: true, kez: true, largo: true };
for (const id in featured) showcaseRoster.push({ id, name: heroes[id].name, image: asset(heroes[id].image) });
for (const id in heroes) if (!featured[id]) showcaseRoster.push({ id, name: heroes[id].name, image: asset(heroes[id].image) });

function Emblem() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M15 17h13l21 29H36L15 17Zm25 0h9v12l-9-12ZM15 35l9 12h-9V35Z" fill="currentColor" /></svg>;
}
function Rule({ icon: Icon, title, text }) {
  return <div className="rule"><div className="rule-icon"><Icon size={19} /></div><div><strong>{title}</strong><p>{text}</p></div></div>;
}

export default function App() {
  const [mode, setMode] = useState('classic');
  const [game, setGame] = useState(null);
  const [guess, setGuess] = useState('');
  const [muted, setMuted] = useState(() => readSaved(storage, 'gth:muted', false) === true);
  const [records, setRecords] = useState(() => {
    const value = readSaved(storage, 'gth:records', {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  });
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [collectionMode, setCollectionMode] = useState('current');
  const [selectedHero, setSelectedHero] = useState(null);
  const [audioError, setAudioError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [shake, setShake] = useState(0);
  const input = useRef(null);
  const audio = useRef(null);
  const nextButton = useRef(null);
  const resultHeading = useRef(null);
  const homeHeading = useRef(null);
  const heroId = game?.order[game.index];
  const hero = heroes[heroId];
  const playing = game && game.status !== 'finished';
  const viewport = useGameViewport(Boolean(playing));
  const revealed = game?.status === 'revealed';
  const art = hero && artwork(hero, game.mode);
  const best = (id) => Number.isFinite(records[id]) ? records[id] : 0;

  function stopAudio() {
    if (audio.current) { audio.current.pause(); audio.current.currentTime = 0; }
  }
  function playVoice(target) {
    stopAudio();
    setAudioError('');
    if (muted || !target?.audio) return;
    const player = new Audio(asset(target.audio));
    player.volume = 0.7;
    audio.current = player;
    player.play().catch(() => setAudioError('Voice could not play. You can retry with the replay button.'));
  }
  function launch(selectedMode = mode) {
    stopAudio(); setMode(selectedMode); setGuess(''); setImageFailed(false); setModal(null);
    // Mount and focus inside the launch gesture: iOS won't open its keyboard
    // from a later effect. Keep this same input mounted throughout the match.
    flushSync(() => setGame(startGame(heroes, selectedMode)));
    input.current?.focus({ preventScroll: true });
  }
  function act(action) {
    setGame((current) => transition(current, action, answers));
    if (action.type === 'next') { stopAudio(); setGuess(''); setImageFailed(false); }
  }
  function keepAnswerFocus(event) {
    if (window.matchMedia('(max-width: 600px), (max-width: 1000px) and (pointer: coarse)').matches) {
      event.preventDefault();
      input.current?.focus({ preventScroll: true });
    }
  }
  function submit(event) {
    event.preventDefault();
    input.current?.focus({ preventScroll: true });
    if (revealed) { act({ type: 'next' }); return; }
    if (game.status !== 'playing') return;
    if (!answers[heroId][normalize(guess)]) {
      setShake((value) => value + 1);
      input.current?.focus({ preventScroll: true });
    }
    act({ type: 'guess', answer: guess });
  }
  function goHome() { stopAudio(); setGame(null); setGuess(''); }
  function toggleMute() {
    stopAudio(); setMuted((value) => !value); writeSaved(storage, 'gth:muted', !muted);
  }
  function openCollection() { stopAudio(); setSearch(''); setSelectedHero(null); setModal('collection'); }

  useEffect(() => {
    const touchScreen = window.matchMedia('(max-width: 600px), (max-width: 1000px) and (pointer: coarse)').matches;
    if (game?.status === 'playing' || (game?.status === 'revealed' && touchScreen)) input.current?.focus({ preventScroll: true });
    if (game?.status === 'revealed' && !touchScreen) nextButton.current?.focus({ preventScroll: true });
    if (game?.status === 'finished') resultHeading.current?.focus({ preventScroll: true });
    if (!game) homeHeading.current?.focus({ preventScroll: true });
  }, [game?.status, heroId]);
  useEffect(() => {
    if (revealed && !muted) playVoice(hero);
    return stopAudio;
  }, [revealed, heroId, muted]);
  useEffect(() => {
    if (game?.status !== 'finished') return;
    stopAudio();
    setRecords((old) => {
      const saved = Number.isFinite(old[game.mode]) ? old[game.mode] : 0;
      if (saved >= game.score) return old;
      const updated = { ...old, [game.mode]: game.score };
      writeSaved(storage, 'gth:records', updated);
      return updated;
    });
  }, [game?.status, game?.score, game?.mode]);
  useEffect(() => {
    if (!playing) return;
    const nextHero = heroes[game.order[game.index + 1]];
    if (nextHero) { const image = new Image(); image.src = asset(artwork(nextHero, game.mode).silhouette); }
  }, [heroId, playing]);

  const visibleHeroes = [];
  for (const id of poolFor(heroes, collectionMode)) {
    if (!search || normalize(heroes[id].name).includes(normalize(search))) visibleHeroes.push(id);
  }

  return <div className={`app-shell ${playing ? 'in-match' : ''} ${playing && viewport.keyboardOpen ? 'keyboard-active' : ''}`}>
    <header className="header">
      <button className="brand" onClick={() => playing ? setModal('quit') : goHome()} aria-label="Guess the Hero home">
        <span className="brand-mark"><Emblem /></span>
        <span><strong>GUESS THE HERO</strong><small>A DOTA 2 SILHOUETTE CHALLENGE</small></span>
      </button>
      <nav aria-label="Main navigation">
        {!playing && <Button variant="ghost" className="collection-nav" onClick={openCollection}><BookOpen size={16} /> Hero archive</Button>}
        <Button variant="ghost" size="icon" onClick={() => setModal('rules')} aria-label="How to play"><Info size={19} /></Button>
        <Button variant="ghost" size="icon" onClick={toggleMute} aria-label={muted ? 'Enable sound' : 'Mute sound'} aria-pressed={muted}>{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}</Button>
        <a className="github-link" href="https://github.com/debanjanc01/guess-the-hero" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={14} /></a>
      </nav>
    </header>

    <main>
      {!game && <>
        <section className="landing">
          <div className="landing-copy">
            <div className="eyebrow"><span className="red-line" /> KNOW THE LEGENDS. PROVE IT.</div>
            <h1 ref={homeHeading} tabIndex={-1}>Out of the shadows.<br /><span>Into your memory.</span></h1>
            <p className="intro">You’ve seen them a thousand times.<br />But can you name them without the details?</p>
            <div className="hero-actions"><Button onClick={() => launch()}><Swords size={19} /> Enter the battlefield <ArrowRight size={18} /></Button><Button variant="ghost" onClick={() => setModal('rules')}>How to play <ChevronRight size={15} /></Button></div>
            <div className="landing-proof"><span><strong>127</strong> heroes</span><i /><span><strong>3</strong> skips</span><i /><span><strong>∞</strong> time to think</span></div>
          </div>
          <HeroOrbit roster={showcaseRoster} suspended={modal !== null} />
        </section>
        <section className="mode-section" aria-label="Choose your roster">
          <div className="section-heading"><div><span className="eyebrow">CHOOSE YOUR ERA</span><h2>One game. A lifetime of heroes.</h2></div><span className="section-note">Your next match: <strong>{counts[mode]} heroes</strong></span></div>
          <div className="mode-grid" role="group" aria-label="Game roster">
            {['original', 'classic', 'current'].map((id) => <button key={id} className={`mode-card ${mode === id ? 'selected' : ''}`} aria-pressed={mode === id} onClick={() => setMode(id)}>
              <div className="mode-top"><span className="mode-number">{MODES[id].number}</span><span className="mode-count">{counts[id]} HEROES</span>{mode === id && <span className="selected-icon"><Check size={13} /></span>}</div>
              <span className="eyebrow">{MODES[id].label}</span><h3>{MODES[id].name}</h3><p>{MODES[id].description}</p><div className="mode-bottom"><span>{best(id) > 0 ? `PERSONAL BEST · ${best(id)} PTS` : 'A NEW CHALLENGE AWAITS'}</span><ArrowUpRight size={18} /></div>
            </button>)}
          </div>
          <div className="new-blood"><span><Sparkles size={15} /> Just here for the new heroes?</span><button onClick={() => launch('newcomers')}>Play New Blood · {counts.newcomers} heroes <ArrowRight size={15} /></button></div>
        </section>
        <section className="field-notes"><Rule icon={Shield} title="A silhouette. A name." text="No choices. No hints. Just your Dota memory." /><Rule icon={Trophy} title="Every legend is worth 10." text="Reveal the hero. Hear their voice. Keep going." /><Rule icon={SkipForward} title="Three chances to move on." text="Spend your skips wisely. Say GG when you’re done." /></section>
        <section className="archive-teaser"><div><span className="eyebrow">FROM THE ANCIENTS TO THE NEW ARRIVALS</span><h2>The legends live on.</h2><p>Original artwork. Archived portraits. Unmistakable voices.</p></div><div className="portrait-strip">{demoIds.map((id) => <img key={id} src={asset(heroes[id].image)} alt={heroes[id].name} loading="lazy" />)}</div><Button variant="secondary" onClick={openCollection}>Explore the archive <ArrowUpRight size={17} /></Button></section>
      </>}

      {playing && <section className={`game-view ${viewport.keyboardOpen ? 'keyboard-open' : ''}`} style={{ '--game-viewport-height': `${viewport.height}px`, '--game-viewport-top': `${viewport.top}px` }}>
        <div className="game-topline"><button className="text-link" onClick={() => setModal('quit')}><ArrowLeft size={15} /> Leave battlefield</button><span className="eyebrow">{MODES[game.mode].label}</span><span className="round">HERO <strong>{String(game.index + 1).padStart(2, '0')}</strong> / {game.order.length}</span></div>
        <div className="game-layout">
          <div className={`hero-stage ${revealed ? 'is-revealed' : ''}`}>
            <div className="stage-top"><span className="eyebrow">{revealed ? 'OUT OF THE SHADOWS' : 'IDENTITY UNKNOWN'}</span><span className="stage-code">{String(game.index + 1).padStart(3, '0')}</span></div>
            <div className="stage-ring" /><div className="stage-ring inner-ring" />
            <div className="hero-image-wrap" key={`${heroId}-${shake}`}>
              {imageFailed ? <div className="image-error"><Shield size={32} /><p>Artwork couldn’t load.</p><Button size="small" variant="secondary" onClick={() => setImageFailed(false)}>Retry artwork</Button></div> : <img className={`stage-hero ${!revealed && !art.original ? 'silhouette' : ''} ${shake > 0 && game.feedback ? 'shake' : ''} ${art.original ? 'original-art' : ''}`} src={asset(revealed ? art.image : art.silhouette)} alt={revealed ? hero.name : 'Mystery hero silhouette'} onError={() => setImageFailed(true)} />}
            </div>
            <div className="stage-floor" /><span className="stage-corner corner-left">+</span><span className="stage-corner corner-right">+</span>
            <div className="stage-bottom">{revealed ? <><span className={`status-badge ${game.outcome}`}>{game.outcome === 'correct' ? <Check size={14} /> : <SkipForward size={14} />}{game.outcome === 'correct' ? 'LEGEND RECOGNIZED · +10' : 'SKIPPED · NO POINTS'}</span><h2>{hero.name}</h2></> : <><span className="question-rune">?</span><p>Every shadow has a name.</p></>}</div>
          </div>
          <div className="game-controls">
            <div className="scoreboard"><div><span className="eyebrow">YOUR SCORE</span><strong className="score-value">{String(game.score).padStart(3, '0')}<small>PTS</small></strong></div><Trophy size={26} strokeWidth={1} /></div>
            <div className="skips"><span className="eyebrow">SKIPS REMAINING</span><div role="group" aria-label={`${game.skips} skips remaining`}>{[1, 2, 3].map((n) => <span key={n} className={`skip-pip ${n <= game.skips ? 'active' : ''}`}><SkipForward size={17} /></span>)}</div></div>
            <form onSubmit={submit} className={`guess-form ${revealed ? 'revealed-form' : ''}`}><span className="eyebrow">TRUST YOUR INSTINCTS</span><h2>Who is this hero?</h2><p>The details are gone. The legend isn’t.</p><label htmlFor="hero-guess">Hero name</label><div className="answer-row"><Input ref={input} id="hero-guess" name="hero-guess" value={guess} onChange={(e) => { if (!revealed) setGuess(e.target.value); }} placeholder="Enter a hero name…" autoComplete="off" spellCheck="false" maxLength={80} aria-describedby="guess-feedback answer-help" autoCapitalize="words" enterKeyHint={revealed ? 'next' : 'go'} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); submit(event); } }} /><Button type="submit" className="full-width" onPointerDown={keepAnswerFocus}><span className="desktop-guess-label">Reveal my fate</span><span className="mobile-guess-label">{revealed ? (game.index + 1 === game.order.length ? 'Results' : 'Next') : 'Guess'}</span><ArrowRight size={18} /></Button></div><p className="feedback" id="guess-feedback" role="status">{revealed ? `${hero.name} · ${game.outcome === 'correct' ? '+10 pts' : 'Skipped'} · Enter to continue` : game.feedback}</p><div className="keyboard-tip" id="answer-help"><kbd>↵</kbd> Enter to submit · common hero aliases accepted</div><Button type="button" variant="secondary" className="full-width skip-button" onPointerDown={keepAnswerFocus} onClick={() => revealed ? playVoice(hero) : act({ type: 'skip' })} disabled={revealed ? muted : game.skips === 0}>{revealed ? <Volume2 size={17} /> : <SkipForward size={17} />}{revealed ? (muted ? 'Sound is muted' : 'Replay hero voice') : (game.skips ? 'Skip this hero' : 'No skips remaining')}<span>{!revealed && `${game.skips}/3`}</span></Button></form>
            {revealed && <div className="reveal-panel"><span className="eyebrow">{game.outcome === 'correct' ? 'WELL PLAYED.' : 'NOW YOU KNOW.'}</span><h2>{hero.name}</h2><blockquote>“{hero.quote}”</blockquote><Button variant="ghost" size="small" onClick={() => playVoice(hero)} disabled={muted}><Volume2 size={16} /> {muted ? 'Sound is muted' : 'Replay hero voice'}</Button><p role="status" className="audio-error">{audioError}</p>{game.mode === 'classic' && hero.archiveImage && <div className="archive-reference"><img src={asset(hero.archiveImage)} alt={`${hero.name} portrait archived in December 2018`} /><span>FROM THE 2018 ARCHIVE<small>Original in-game portrait</small></span></div>}<Button ref={nextButton} className="full-width next-button" onPointerDown={keepAnswerFocus} onClick={() => act({ type: 'next' })}>{game.index + 1 === game.order.length ? 'See match results' : 'Next hero'} <ArrowRight size={18} /></Button></div>}
            <div className="game-meta"><span><Trophy size={13} /> Best: {best(game.mode)} pts</span><button className="gg-button" onClick={() => setModal('quit')} aria-label="GG — end match">GG · Quit <Flag size={15} /></button></div>
            <p className="asset-note">{art.original ? 'Original Android artwork · 2017' : 'Current render · classic roster does not imply historical artwork'}{game.mode === 'classic' && <><br />Voice line ID verified in 2018; audio from current extraction.</>}</p>
          </div>
        </div>
        <div className="match-progress"><div className="progress-label"><span>THE JOURNEY</span><span>{game.correct + game.skipped} / {game.order.length} heroes revealed</span></div><div className="progress-rail"><div style={{ width: `${(game.correct + game.skipped) / game.order.length * 100}%` }} /></div></div>
      </section>}

      {game?.status === 'finished' && <section className="results"><div className="result-emblem"><Trophy size={46} strokeWidth={1} /></div><span className="eyebrow">{game.reason === 'completed' ? 'THE BATTLEFIELD IS CLEAR' : 'UNTIL THE NEXT BATTLE'}</span><h1 ref={resultHeading} tabIndex={-1}>GG. Well played.</h1><p>Some legends never leave your memory.</p><div className="result-score">{game.score}<span>POINTS EARNED</span></div>{game.score > 0 && game.score >= best(game.mode) && <div className="best-banner"><Sparkles size={16} /> Personal best · {MODES[game.mode].name}</div>}<div className="result-stats"><div><strong>{game.correct}</strong><span>RECOGNIZED</span></div><div><strong>{game.skipped}</strong><span>SKIPPED</span></div><div><strong>{best(game.mode)}</strong><span>PERSONAL BEST</span></div></div><div className="result-actions"><Button onClick={() => launch(game.mode)}><RotateCcw size={17} /> One more battle</Button><Button variant="secondary" onClick={goHome}>Choose another era <ArrowRight size={17} /></Button></div><p className="result-local">High scores live in this browser, separately for each roster.</p></section>}
    </main>

    <footer><span className="footer-brand"><span className="mini-diamond" /> A SMALL GAME. A BIG LOVE FOR DOTA.</span><span>Rebuilt from the 2017 Android original by Debanjan.</span><button onClick={() => setModal('credits')}>Assets & credits <ArrowUpRight size={12} /></button></footer>

    <Modal open={modal === 'rules'} onOpenChange={(open) => !open && setModal(null)} title="Know your battlefield." description="A little memory. A lot of Dota.">
      <div className="rules-list"><Rule icon={Search} title="Name the silhouette" text="Type a hero’s name and press Enter. Case, spacing, punctuation, and common aliases don’t matter. Wrong guesses don’t cost points." /><Rule icon={Trophy} title="Recognize. Reveal. Repeat." text="A correct answer earns 10 points, reveals the artwork, and plays a signature voice. Press Next to continue." /><Rule icon={SkipForward} title="Three skips for the whole match" text="Skipping reveals the answer without awarding points. Once you’ve used all three, keep guessing or say GG. There’s no timer." /><Rule icon={BookOpen} title="Choose your era" text="Original uses the 32 original images. Classic has the December 2018 roster. All Pick includes all 127 currently verified heroes. New Blood focuses on the 11 post-2018 arrivals." /></div><Button className="full-width" onClick={() => setModal(null)}>Got it <Check size={17} /></Button>
    </Modal>
    <Modal open={modal === 'quit'} onOpenChange={(open) => !open && setModal(null)} title="Call it GG?" description="End this match and save your score. The ancients can wait."><div className="quit-score">{game?.score ?? 0}<span>POINTS SO FAR</span></div><div className="modal-actions"><Button variant="secondary" onClick={() => setModal(null)}>Keep playing</Button><Button onClick={() => { act({ type: 'quit' }); setModal(null); }}>GG, well played <Flag size={16} /></Button></div></Modal>
    <Modal open={modal === 'credits'} onOpenChange={(open) => !open && setModal(null)} title="Made for the love of Dota." description="Unofficial, non-commercial fan game. Not affiliated with or endorsed by Valve."><div className="credits-text"><p>Dota 2, hero artwork, and audio belong to Valve Corporation. UI code uses React, Radix, shadcn-style primitives, Lucide, and open-source fonts. Asset rights are separate from code licensing.</p><h3>What’s historical?</h3><p>The original 32 images come from this game’s Android repository. 113 portraits are frozen from a December 2018 game archive. Classic voice-line identifiers are checked against 2018 response scripts, but the MP3s are current extractions—not guaranteed byte-identical 2018 recordings.</p><p>For silhouettes beyond the original 32, we use current transparent Valve renders. Three classic heroes have no portrait in the checked archive. These fallbacks are deliberately not labeled as historical artwork.</p><h3>Sources</h3><p>Valve’s official roster and media CDN; OpenDota’s versioned 2018 roster; SteamTracking’s game archive; mdiller’s Dotabase response metadata and audio extraction.</p><a href="https://github.com/debanjanc01/guess-the-hero/blob/master/web/ASSETS.md" target="_blank" rel="noreferrer">Read the asset ledger and usage notes <ArrowUpRight size={14} /></a></div></Modal>
    <Modal open={modal === 'collection'} onOpenChange={(open) => { if (!open) { stopAudio(); setModal(null); } }} className="collection-dialog" title={selectedHero ? heroes[selectedHero].name : 'The hero archive.'} description={selectedHero ? 'A legend, an image, an unmistakable voice.' : 'Explore the artwork and signature voices behind the challenge.'}>
      {selectedHero ? <div className="hero-detail"><Button variant="ghost" size="small" onClick={() => { stopAudio(); setSelectedHero(null); }}><ArrowLeft size={15} /> Back to archive</Button><img className="detail-render" src={asset(heroes[selectedHero].image)} alt={heroes[selectedHero].name} /><blockquote>“{heroes[selectedHero].quote}”</blockquote>{muted ? <Button variant="secondary" onClick={toggleMute}><Volume2 size={17} />Enable sound</Button> : <Button variant="secondary" onClick={() => playVoice(heroes[selectedHero])}><Volume2 size={17} />Play signature voice</Button>}<p role="status" className="audio-error">{audioError}</p><div className="historical-images">{heroes[selectedHero].originalImage && <figure><img src={asset(heroes[selectedHero].originalImage)} alt="Original Android artwork" /><figcaption>Original Android · 2017</figcaption></figure>}{heroes[selectedHero].archiveImage && <figure><img src={asset(heroes[selectedHero].archiveImage)} alt="Archived 2018 portrait" /><figcaption>Archived portrait · 2018</figcaption></figure>}</div><p className="asset-note">Main artwork: current Valve render. {heroes[selectedHero].historicalLineVerified ? 'Voice-line ID verified in December 2018 scripts; recording sourced from current extraction.' : 'Voice sourced from current game extraction.'}</p></div> : <><div className="archive-toolbar"><div className="search-wrap"><Search size={17} /><Input aria-label="Search heroes" placeholder="Search the legends…" value={search} onChange={(e) => setSearch(e.target.value)} /></div><label className="sr-only" htmlFor="collection-mode">Archive roster</label><select id="collection-mode" value={collectionMode} onChange={(e) => setCollectionMode(e.target.value)}>{Object.keys(MODES).map((id) => <option key={id} value={id}>{MODES[id].name} ({counts[id]})</option>)}</select></div><p className="archive-count" role="status">{visibleHeroes.length} heroes · select one to explore</p><div className="archive-grid">{visibleHeroes.map((id) => <button className="archive-card" key={id} onClick={() => { setAudioError(''); setSelectedHero(id); }}><img src={asset(heroes[id].image)} alt="" loading="lazy" /><span>{heroes[id].name}</span>{!heroes[id].classic && <small>NEW ERA</small>}</button>)}</div>{visibleHeroes.length === 0 && <p className="empty-state">No legends found. Try another name.</p>}</>}
    </Modal>
  </div>;
}
