export default function BackgroundGrid() {
  return (
    <>
      {/* Grid */}
      <div
        className="
          absolute
          inset-0
          -z-10
          opacity-[0.06]
          bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)]
          bg-[size:64px_64px]
          [mask-image:radial-gradient(circle_at_center,black,transparent_90%)]
        "
      />

      {/* Radial Glow */}
      <div
        className="
          absolute
          left-1/2
          top-40
          -z-10
          h-[700px]
          w-[700px]
          -translate-x-1/2
          rounded-full
          bg-[radial-gradient(circle,rgba(200,255,61,0.12),transparent_70%)]
          blur-3xl
        "
      />

      {/* Vignette */}
      <div
        className="
          absolute
          inset-0
          -z-10
          bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.55))]
        "
      />
    </>
  );
}