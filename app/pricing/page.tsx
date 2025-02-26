// app/pricing/page.tsx
import PricingPage from "@/components/pricing-page";
import { Navbar } from "@/components/navbar-with-pricing";

export default function Pricing() {
  return (
    <>
      <Navbar />
      <PricingPage />
    </>
  );
}