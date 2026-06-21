import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Shield, MapPin, Compass, Map, Menu, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SosButton } from "@/components/sos-button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useSocket } from "@/context/socket-context";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { username, connected } = useSocket();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { href: "/", label: "Home", icon: <Compass className="w-4 h-4 mr-2" /> },
    { href: "/map", label: "Map", icon: <Map className="w-4 h-4 mr-2" /> },
    { href: "/places", label: "Places", icon: <MapPin className="w-4 h-4 mr-2" /> },
    { href: "/guides", label: "Guides", icon: <Users className="w-4 h-4 mr-2" /> },
    { href: "/suggest", label: "Suggest", icon: <Sparkles className="w-4 h-4 mr-2" /> },
    { href: "/sos", label: "SOS Center", icon: <Shield className="w-4 h-4 mr-2" /> },
  ];

  const isMapPage = location === "/map";

  return (
    <div className="min-h-screen flex flex-col w-full bg-background relative text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2 text-primary font-bold text-xl tracking-tight">
              <Shield className="w-6 h-6 fill-primary/20" />
              <span>SafeTravel</span>
            </Link>
            <nav className="hidden md:flex gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    location === link.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {username && (
              <span className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`} />
                {username}
              </span>
            )}
            <SosButton />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
                <SheetTitle className="text-left font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  SafeTravel
                </SheetTitle>
                <SheetDescription className="sr-only">Navigation Menu</SheetDescription>
                <div className="flex flex-col space-y-3 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                        location === link.href
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className={`flex-1 flex flex-col ${isMapPage ? "overflow-hidden" : ""}`}>
        {children}
      </main>

      {!isMapPage && (
        <footer className="border-t py-8 md:py-12 bg-card text-card-foreground">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Shield className="w-5 h-5 fill-primary/20" />
              <span>SafeTravel</span>
            </div>
            <p className="text-sm text-muted-foreground">
              A trustworthy companion for solo travelers.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="/" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="/sos" className="hover:text-primary transition-colors">Emergency</Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
