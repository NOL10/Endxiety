import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import MoodTrackerPage from "@/pages/mood-tracker-page";
import CommunityPage from "@/pages/community-page";
import ChatPage from "@/pages/chat-page";
import AnalyticsPage from "@/pages/analytics-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/mood" component={MoodTrackerPage} />
      <ProtectedRoute path="/community" component={CommunityPage} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
