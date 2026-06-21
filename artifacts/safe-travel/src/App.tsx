import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { SocketProvider } from "@/context/socket-context";
import { SosAlertBanner } from "@/components/sos-alert-banner";
import { UsernamePrompt } from "@/components/username-prompt";

import Home from "@/pages/home";
import Guides from "@/pages/guides";
import Places from "@/pages/places";
import PlaceDetail from "@/pages/place-detail";
import SosCenter from "@/pages/sos";
import Suggest from "@/pages/suggest";
import MapExplorer from "@/pages/map";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/guides" component={Guides} />
        <Route path="/map" component={MapExplorer} />
        <Route path="/places" component={Places} />
        <Route path="/places/:id" component={PlaceDetail} />
        <Route path="/sos" component={SosCenter} />
        <Route path="/suggest" component={Suggest} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SocketProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <SosAlertBanner />
            <UsernamePrompt />
            <Router />
          </WouterRouter>
          <Toaster />
        </SocketProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
