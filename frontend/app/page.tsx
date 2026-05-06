import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import Introduction from "@/components/sections/Introduction";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-hidden bg-background">
      <Navbar />
      <Hero />
      <Introduction />
      <WhyChooseUs />
      <Contact />
      <Footer />
    </main>
  );
}
