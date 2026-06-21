import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

// Import pages
import Home from "@/pages/home";
import Guides from "@/pages/guides";
import Places from "@/pages/places";
import PlaceDetail from "@/pages/place-detail";
import SosCenter from "@/pages/sos";
import Suggest from "@/pages/suggest";

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
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
