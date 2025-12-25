import React, { useEffect, useState } from 'react';

const VideoBg: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    // Observe class changes on <html> to react to theme toggles
    const el = document.documentElement;
    const obs = new MutationObserver(() => {
      setIsDark(el.classList.contains('dark'));
    });
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const src = isDark ? '/darkbg.mp4' : '/lightbg.mp4';

  return (
    <div aria-hidden className="fixed inset-0 z-0 w-full h-full pointer-events-none">
      <video
        key={src}
        src={src}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-black/10 dark:bg-black/30 pointer-events-none" />
    </div>
  );
};

export default VideoBg;
