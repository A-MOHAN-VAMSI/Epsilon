import PricingCard from "./PricingCard";
import { plans } from "./pricingData";

export default function PricingGrid() {
  return (
    <div className="mx-auto mt-12 grid max-w-[1200px] grid-cols-1 gap-5 sm:mt-16 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch lg:gap-8">
      {plans.map((plan, i) => (
        <PricingCard key={plan.id} plan={plan} index={i} />
      ))}
    </div>
  );
}
