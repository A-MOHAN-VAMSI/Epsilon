import FeatureCard from "./FeatureCard";
import { features } from "./featureData";

export default function FeatureGrid() {
  return (
    <div className="mt-12 grid gap-5 sm:mt-16 sm:gap-6 md:grid-cols-2 lg:gap-8">
      {features.map((feature) => (
        <FeatureCard
          key={feature.title}
          {...feature}
        />
      ))}
    </div>
  );
}
