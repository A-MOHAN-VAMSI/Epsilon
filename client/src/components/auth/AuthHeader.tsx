interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export default function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-white/60">{subtitle}</p>
    </>
  );
}

