import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ThemeProvider } from "./contexts/ThemeContext";
import NotFound from "./pages/not-found";
import LoginPage from "./pages/auth/Login";
import Dashboard from "./pages/dashboard";
import OrdersList from "./pages/orders/orders-list";
import OrderDetails from "./pages/orders/order-details";
import ProductsList from "./pages/products/products-list";
import ProductForm from "./pages/products/product-form-new";
import ExcelUpload from "./pages/products/excel-upload";
import Departments from "./pages/departments/departments";
import CashierPOS from "./pages/pos/cashier";
// import QRVerification from "./pages/pos/qr-verification";
import BranchesList from "./pages/branches/branches-list";
import PromotionsList from "./pages/promotions/promotions-list";
import StoriesList from "./pages/stories/stories-list";
import ReturnsPage from "./pages/returns/returns-page";
import UsersList from "./pages/users/users-list";
import AddUserPage from "./pages/users/add-user";
import EditUser from "./pages/users/edit-user";
import RolesManagement from "./pages/roles/roles-management";
import GuestCustomers from "./pages/customers/guest-customers";
import CustomersListPage from "./pages/customers/customers-list";
import ReportsDashboard from "./pages/reports/reports-dashboard";
import StoresListPage from "./pages/stores/stores-list";
import StoreFormPage from "./pages/stores/store-form";
import SettingsPage from "./pages/settings/settings";
import NotificationsPage from "./pages/notifications/notifications";
import ProfilePage from "./pages/profile/profile";
import ApiTestPage from "./pages/ApiTestPage";
import Loading from "./components/common/loading";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={LoginPage} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/orders" component={OrdersList} />
          <Route path="/orders/:id" component={OrderDetails} />
          <Route path="/products" component={ProductsList} />
          <Route path="/products/new" component={ProductForm} />
          <Route path="/products/edit/:id" component={ProductForm} />
          <Route path="/products/upload" component={ExcelUpload} />
          <Route path="/departments" component={Departments} />
          <Route path="/branches" component={BranchesList} />
          <Route path="/users" component={UsersList} />
          <Route path="/users/add" component={AddUserPage} />
          <Route path="/users/edit/:id" component={EditUser} />
          <Route path="/roles" component={RolesManagement} />
          <Route path="/promotions" component={PromotionsList} />
          <Route path="/stories" component={StoriesList} />
          <Route path="/returns" component={ReturnsPage} />
          <Route path="/customers/guests" component={GuestCustomers} />
          <Route path="/customers" component={CustomersListPage} />
          <Route path="/reports" component={ReportsDashboard} />
          <Route path="/stores" component={StoresListPage} />
          <Route path="/stores/:slug" component={StoreFormPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/notifications" component={NotificationsPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/pos" component={CashierPOS} />
          <Route path="/api-test" component={ApiTestPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Debug API configuration
  console.log('🔧 API Base URL:', import.meta.env.VITE_API_BASE_URL);
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
