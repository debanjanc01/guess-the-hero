import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { Button } from './ui.jsx';
import './hero-orbit.css';

// Keep Three.js out of the initial/gameplay bundle and out of reduced-motion sessions.
const OrbitScene = lazy(() => import('./OrbitScene.jsx'));
const motionQuery = '(prefers-reduced-motion: reduce)';

function StaticHeroes({ images }) {
  return <div className="orbit-static" aria-hidden="true">
    <img className="orbit-static-back" src={images[1]} alt="" />
    <img className="orbit-static-front" src={images[0]} alt="" />
  </div>;
}

class SceneFallback extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onUnavailable(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function HeroOrbit({ roster, suspended = false }) {
  const region = useRef(null);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia(motionQuery).matches);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(() => !document.hidden);
  const [available, setAvailable] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [nextRequest, setNextRequest] = useState(0);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(motionQuery);
    const changed = () => setReducedMotion(query.matches);
    query.addEventListener('change', changed);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(region.current);
    const visibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      query.removeEventListener('change', changed);
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  const running = !paused && !reducedMotion && visible && tabVisible && !suspended && available;
  const fallback = <StaticHeroes images={[roster[activeIndex].image, roster[(activeIndex + 1) % roster.length].image]} />;
  const nextHero = () => {
    if (reducedMotion || !available) setActiveIndex((index) => (index + 1) % roster.length);
    else setNextRequest((request) => request + 1);
  };

  return <section ref={region} className="landing-art hero-orbit" aria-label="Hero carousel">
    <div className="art-orbit orbit-one" aria-hidden="true" /><div className="art-orbit orbit-two" aria-hidden="true" />
    <div className="orbit-label">THE DIRE <span>/</span> THE RADIANT</div>
    <div className="orbit-viewport" aria-hidden="true">
      {reducedMotion || !available ? fallback : <SceneFallback fallback={fallback} onUnavailable={() => setAvailable(false)}>
        <Suspense fallback={fallback}><OrbitScene roster={roster} initialIndex={activeIndex} running={running} nextRequest={nextRequest} onChange={setActiveIndex} onMoving={setMoving} onUnavailable={() => setAvailable(false)} /></Suspense>
      </SceneFallback>}
    </div>
    <div className="art-floor" aria-hidden="true" />
    <div className="art-caption"><span className="mini-diamond" /> EVERY SHADOW HAS A NAME</div>
    <span className="art-cross cross-top" aria-hidden="true">+</span><span className="art-cross cross-bottom" aria-hidden="true">+</span>
    <div className="orbit-controls">
      <span>{String(activeIndex + 1).padStart(3, '0')} / {roster.length} · {roster[activeIndex].name}</span>
      {!reducedMotion && available && <Button variant="ghost" size="icon" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Resume hero carousel' : 'Pause hero carousel'} aria-pressed={paused}>
        {paused ? <Play size={14} /> : <Pause size={14} />}
      </Button>}
      <Button variant="ghost" size="icon" onClick={nextHero} disabled={available && !reducedMotion && moving} aria-label="Next showcase hero"><ArrowRight size={15} /></Button>
    </div>
  </section>;
}
