import { Hero } from "@/components/marketing/Hero";
import {
  HowItWorks,
  TwoModes,
  CodeShowcase,
  FAQ,
  FinalCTA,
} from "@/components/marketing/sections";
import { JsonLd } from "@/components/seo/JsonLd";
import { softwareSchema } from "@/lib/seo/structured-data";

export default function HomePage() {
  return (
    <>
      <JsonLd data={softwareSchema()} />
      <Hero />
      <HowItWorks />
      <TwoModes />
      <CodeShowcase />
      <FAQ />
      <FinalCTA />
    </>
  );
}
