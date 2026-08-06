interface AuthCardProps {
  children: React.ReactNode;
}

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <section
      className="
        w-full
        max-w-[560px]
        rounded-[28px]
        border
        border-white/10
        bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))]
        p-6
        shadow-[0_28px_80px_rgba(0,0,0,0.42)]
        backdrop-blur-xl
        sm:p-10
      "
    >
      {children}
    </section>
  );
}

