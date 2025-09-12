import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";


import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Flashcards from "./pages/Flashcards";
import Games from "./pages/Games";
import Practice from "./pages/Practice";
import CreateContent from "./pages/CreateContent";
import StudentProgress from "./pages/StudentProgress";
import Profile from "./pages/Profile";
import Culture from "./pages/Culture";
import Notes from "./pages/Notes";
import NotFound from "./pages/NotFound";

const App = () => (
  <AuthProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Index />} />
          <Route path="flashcards" element={<Flashcards />} />
          <Route path="games" element={<Games />} />
          <Route path="practice" element={<Practice />} />
          <Route path="create-content" element={<CreateContent />} />
          <Route path="student-progress" element={<StudentProgress />} />
          <Route path="profile" element={<Profile />} />
          <Route path="culture" element={<Culture />} />
          <Route path="notes" element={<Notes />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
