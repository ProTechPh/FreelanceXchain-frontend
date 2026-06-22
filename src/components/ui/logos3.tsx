"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import { motion } from "framer-motion";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface Logo {
  id: string;
  description: string;
  image: string;
  className?: string;
}

interface Logos3Props {
  heading?: string;
  logos?: Logo[];
  className?: string;
}

const Logos3 = ({
  heading = "Powered by Industry Leaders",
  logos = [
    {
      id: "logo-1",
      description: "Ethereum",
      image: "https://cdn.worldvectorlogo.com/logos/ethereum-1.svg",
      className: "h-8 w-auto",
    },
    {
      id: "logo-2",
      description: "Appwrite",
      image: "https://appwrite.io/assets/logomark/logo.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-3",
      description: "Cloudflare",
      image: "https://cdn.worldvectorlogo.com/logos/cloudflare-1.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-4",
      description: "Next.js",
      image: "https://cdn.worldvectorlogo.com/logos/next-js.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-5",
      description: "React",
      image: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-6",
      description: "TypeScript",
      image: "https://cdn.worldvectorlogo.com/logos/typescript.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-7",
      description: "Tailwind CSS",
      image: "https://cdn.worldvectorlogo.com/logos/tailwind-css-2.svg",
      className: "h-5 w-auto",
    },
    {
      id: "logo-8",
      description: "Vercel",
      image: "https://cdn.worldvectorlogo.com/logos/vercel.svg",
      className: "h-6 w-auto",
    },
  ],
}: Logos3Props) => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">
            Built on <span className="gradient-text">Proven Tech</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every layer of FreelanceXchain is built on battle-tested open standards.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="relative mx-auto flex items-center justify-center lg:max-w-5xl"
        >
          <Carousel
            opts={{ loop: true }}
            plugins={[AutoScroll({ playOnInit: true })]}
          >
            <CarouselContent className="ml-0">
              {logos.map((logo) => (
                <CarouselItem
                  key={logo.id}
                  className="flex basis-1/3 justify-center pl-0 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
                >
                  <div className="mx-10 flex shrink-0 items-center justify-center">
                    <div className="glass border border-border/40 rounded-xl px-5 py-4 flex items-center justify-center hover:border-primary/30 transition-colors duration-300">
                      <img
                        src={logo.image}
                        alt={logo.description}
                        className={logo.className}
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                      />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="absolute inset-y-0 left-0 w-12 bg-linear-to-r from-background to-transparent"></div>
          <div className="absolute inset-y-0 right-0 w-12 bg-linear-to-l from-background to-transparent"></div>
        </motion.div>
      </div>
    </section>
  );
};

export { Logos3 };
