/* Nexia Lab — Tweaks panel */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "hero": "editorial",
  "heroAnim": "constellation",
  "accent": "#CFFF3D",
  "showStats": true,
  "density": "comfortable"
}/*EDITMODE-END*/;

  const {
  TweaksPanel, useTweaks,
  TweakSection, TweakRadio, TweakToggle, TweakColor, TweakSelect
} = window;

function NexiaTweaks() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--lime', t.accent);
    document.documentElement.style.setProperty('--lime-glow', t.accent + '55');
    document.documentElement.style.setProperty('--lime-soft', t.accent + '1A');
  }, [t.accent]);

  React.useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    hero.dataset.variant = t.hero;
    const a = hero.querySelector('.hero-a');
    const b = hero.querySelector('.hero-b');
    if (a && b) {
      if (t.hero === 'kinetic') { a.hidden = true; b.hidden = false; }
      else { a.hidden = false; b.hidden = true; }
    }
  }, [t.hero]);

  React.useEffect(() => {
    const right = document.querySelector('.hero-right');
    if (right) right.style.display = t.showStats ? '' : 'none';
  }, [t.showStats]);

  React.useEffect(() => {
    document.documentElement.style.setProperty(
      '--pad',
      t.density === 'compact'
        ? 'clamp(16px, 3vw, 36px)'
        : t.density === 'spacious'
        ? 'clamp(28px, 5vw, 80px)'
        : 'clamp(20px, 4vw, 56px)'
    );
  }, [t.density]);

  React.useEffect(() => {
    if (window.__nexiaHeroAnim) window.__nexiaHeroAnim.setVariant(t.heroAnim);
  }, [t.heroAnim]);

  return (
    <TweaksPanel title="Tweaks · Nexia Lab">
      <TweakSection title="Hero">
        <TweakRadio
          label="Variante"
          value={t.hero}
          options={[
            { value: 'editorial', label: 'Editorial' },
            { value: 'kinetic', label: 'Cinético' },
          ]}
          onChange={v => setTweak('hero', v)}
        />
        <TweakSelect
          label="Animación de fondo"
          value={t.heroAnim}
          options={[
            { value: 'constellation', label: 'Constelación (red de nodos)' },
            { value: 'bars', label: 'Barras (data viz)' },
            { value: 'aurora', label: 'Aurora lima (suave)' },
            { value: 'none', label: 'Sin animación' },
          ]}
          onChange={v => setTweak('heroAnim', v)}
        />
        <TweakToggle
          label="Mostrar tarjeta de resultados"
          value={t.showStats}
          onChange={v => setTweak('showStats', v)}
        />
      </TweakSection>

      <TweakSection title="Color">
        <TweakColor
          label="Acento"
          value={t.accent}
          options={['#CFFF3D', '#A6FF5A', '#E8FF35', '#5AE5C8', '#FF7A4D']}
          onChange={v => setTweak('accent', v)}
        />
      </TweakSection>

      <TweakSection title="Densidad">
        <TweakRadio
          label="Padding lateral"
          value={t.density}
          options={[
            { value: 'compact', label: 'Compacto' },
            { value: 'comfortable', label: 'Normal' },
            { value: 'spacious', label: 'Amplio' },
          ]}
          onChange={v => setTweak('density', v)}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

const root = document.createElement('div');
root.id = '__nexia-tweaks-root';
document.body.appendChild(root);
ReactDOM.createRoot(root).render(<NexiaTweaks />);
