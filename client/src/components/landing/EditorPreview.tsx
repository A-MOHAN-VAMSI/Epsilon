import EditorHeader from "./EditorHeader";
import Explorer from "./Explorer";
import CodeWindow from "./CodeWindow";

export default function EditorPreview() {
  return (
    <div id="editor" className="relative mx-auto mt-16 max-w-[1280px] animate-editor-float transition-transform duration-500 hover:-translate-y-2 sm:mt-20 lg:mt-24">
      <div className="absolute inset-0 -z-10 scale-[1.04] rounded-[42px] bg-[#C8FF3D]/[0.08] blur-[110px]" />
      <div className="relative overflow-hidden rounded-[22px] border border-white/20 bg-[#090e17]/90 ring-1 ring-white/10 shadow-[0_32px_100px_rgba(0,0,0,0.72),0_0_60px_rgba(200,255,61,0.07)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-white/10 via-white/[0.025] to-transparent" />
        <EditorHeader />
        <div className="flex h-[390px] sm:h-[440px] lg:h-[490px]">
          <Explorer />
          <CodeWindow />
        </div>
      </div>
    </div>
  );
}
