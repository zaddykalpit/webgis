import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Shield, MapPin, Compass, Map, Menu, Users, Sparkles, LogIn, UserPlus, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SosButton } from "@/components/sos-button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { href: "/",        label: "Home",       icon: <Compass  className="w-4 h-4 mr-2" /> },
    { href: "/map",     label: "Map",        icon: <Map      className="w-4 h-4 mr-2" /> },
    { href: "/places",  label: "Places",     icon: <MapPin   className="w-4 h-4 mr-2" /> },
    { href: "/guides",  label: "Guides",     icon: <Users    className="w-4 h-4 mr-2" /> },
    { href: "/suggest", label: "Suggest",    icon: <Sparkles className="w-4 h-4 mr-2" /> },
    { href: "/sos",     label: "SOS Center", icon: <Shield   className="w-4 h-4 mr-2" /> },
  ];

  const isMapPage = location === "/map" || location.startsWith("/map?");

  async function handleLogout() {
    await logout();
    setLocation("/");
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-6 min-w-0">
            <Link href="/" className="flex items-center space-x-2 text-primary font-bold text-xl tracking-tight shrink-0">
              <Shield className="w-6 h-6 fill-primary/20" />
              <span>Yatra</span>
            </Link>

            <nav className="hidden md:flex gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${
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

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            <SosButton />

            {/* Desktop auth */}
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground border rounded-full px-3 py-1.5">
                  <User className="w-3.5 h-3.5" />
                  {user.username}
                </span>
                <Button variant="ghost" size="sm" className="rounded-full" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1.5" /> Sign out
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setLocation("/login")}>
                  <LogIn className="w-4 h-4 mr-1.5" /> Sign in
                </Button>
                <Button size="sm" className="rounded-full" onClick={() => setLocation("/signup")}>
                  <UserPlus className="w-4 h-4 mr-1.5" /> Create account
                </Button>
              </div>
            )}

            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
                <SheetTitle className="text-left font-bold mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Yatra
                </SheetTitle>
                <SheetDescription className="sr-only">Navigation Menu</SheetDescription>

                {user && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{user.username}</span>
                  </div>
                )}

                <div className="flex flex-col space-y-2 mt-4">
                  {navLinks.map(link => (
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

                  <div className="pt-3 border-t space-y-2">
                    {user ? (
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2" /> Sign out
                      </button>
                    ) : (
                      <>
                        <Link href="/login" className="flex items-center px-4 py-3 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <LogIn className="w-4 h-4 mr-2" /> Sign in
                        </Link>
                        <Link href="/signup" className="flex items-center px-4 py-3 rounded-xl text-base font-medium bg-primary text-primary-foreground">
                          <UserPlus className="w-4 h-4 mr-2" /> Create account
                        </Link>
                      </>
                    )}
                  </div>
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
              <span>Yatra</span>
            </div>
            <p className="text-sm text-muted-foreground">
              A safety-first travel companion for Nepal.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/"    className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="/"    className="hover:text-primary transition-colors">Terms</Link>
              <Link href="/sos" className="hover:text-primary transition-colors">Emergency</Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
