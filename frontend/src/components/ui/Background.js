export default function Background() {
  return (
    <>
      {/* Customizable gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-slate-900 to-black animate-[pulseBG_12s_ease-in-out_infinite]" />

      {/* Animated accent overlays - customize colors for your theme */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_60%),radial-gradient(circle_at_70%_30%,rgba(147,197,253,0.18),transparent_55%),radial-gradient(circle_at_50%_80%,rgba(96,165,250,0.22),transparent_55%),radial-gradient(circle_at_85%_75%,rgba(244,114,182,0.15),transparent_55%),radial-gradient(circle_at_10%_90%,rgba(45,212,191,0.18),transparent_55%)] animate-[drift_40s_linear_infinite]" />

      {/* Optional texture overlay - remove or replace with your own */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-light.png')] opacity-30 animate-[cloudMove_60s_linear_infinite]" />
    </>
  );
}
