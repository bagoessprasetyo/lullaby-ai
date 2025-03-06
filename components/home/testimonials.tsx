import { motion } from "framer-motion";
import { Star } from "lucide-react";

export function Testimonials() {
  const testimonials = [
    {
      quote: "Lullaby.ai has transformed our bedtime routine. The stories are magical!",
      name: "Sarah L.",
      rating: 5,
    },
    {
      quote: "My kids love the personalized stories. It's a game-changer!",
      name: "John D.",
      rating: 5,
    },
    {
      quote: "A wonderful way to end the day. The music and narration are perfect.",
      name: "Emily R.",
      rating: 4,
    },
  ];

  return (
    <div className="py-12 bg-gray-50 dark:bg-gray-900">
      <h2 className="text-3xl font-bold text-center mb-8">What Parents Say</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
          >
            <p className="text-lg italic mb-4">&quot;{testimonial.quote}&quot;</p>
            <div className="flex items-center mb-2">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} size={16} className="text-yellow-500" />
              ))}
            </div>
            <p className="text-sm font-semibold">- {testimonial.name}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default Testimonials;