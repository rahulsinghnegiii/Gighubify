import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import BecomeSeller from "./pages/BecomeSeller";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useState, useEffect } from "react";
import ServiceDetail from "./pages/ServiceDetail";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import AddGig from "./pages/AddGig";
import BuyerDashboard from "./pages/BuyerDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import { AuthProvider } from "./lib/contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CreateService from "./pages/CreateService";
import EditService from "./pages/EditService";
import Checkout from "./pages/Checkout";
import TestPayment from "./pages/TestPayment";
import PaymentDashboard from "./pages/PaymentDashboard";
import OrderDetail from "./pages/OrderDetail";
import Messages from "./pages/Messages";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading time
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4"></div>
          <p className="text-muted-foreground animate-pulse">Loading GigHubify...</p>
        </div>
      </div>
    );
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <div className="flex-grow">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/become-seller" element={<BecomeSeller />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/service/:id" element={<ServiceDetail />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route 
                    path="/checkout/:orderId" 
                    element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/test-payment" 
                    element={
                      <ProtectedRoute>
                        <TestPayment />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/add-gig" 
                    element={
                      <ProtectedRoute>
                        <AddGig />
                      </ProtectedRoute>
                    } 
                  />
                  {/* Dashboard Routes */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <BuyerDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/seller/dashboard" 
                    element={
                      <ProtectedRoute>
                        <SellerDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/seller/create-service" 
                    element={
                      <ProtectedRoute>
                        <CreateService />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/seller/edit-service/:id" 
                    element={
                      <ProtectedRoute>
                        <EditService />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/payment-dashboard" 
                    element={
                      <ProtectedRoute>
                        <PaymentDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/order/:orderId" 
                    element={
                      <ProtectedRoute>
                        <OrderDetail />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/messages" 
                    element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/messages/:userId" 
                    element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    } 
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Footer />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
