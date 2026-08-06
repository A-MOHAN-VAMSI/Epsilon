import TestimonialCard from "./TestimonialCard";
import { testimonials } from "./testimonialData";

export default function TestimonialGrid() {
  return (
    <div className="mt-12 grid grid-cols-1 gap-5 sm:mt-16 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
      {testimonials.map((testimonial, i) => (
        <TestimonialCard key={testimonial.id} testimonial={testimonial} index={i} />
      ))}
    </div>
  );
}
