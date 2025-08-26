import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { SearchDashboard } from "@/components/SearchDashboard";
import { PriceTrendChart } from "@/components/PriceTrendChart";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <SearchDashboard />
        <PriceTrendChart />
      </main>
    </div>
  );
};

export default Index;
