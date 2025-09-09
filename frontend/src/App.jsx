import { useEffect, useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { SnackbarProvider } from "notistack";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Import pages
import AnalyzingPage from "./pages/AnalyzingPage/AnalyzingPage";
import HomePage from "./pages/HomePage/HomePage";
import OrderPage from "./pages/OrderPage/OrderPage";
import SelectPaymentPage from "./pages/SelectPaymentPage/SelectPaymentPage";
import PayingPage from "./pages/PayingPage/PayingPage";
import OrderBillPage from "./pages/OrderBillPage/OrderBillPage";
import OperatorPage from "./pages/OperatorPage/OperatorPage";
import RefillPage from "./pages/RefillPage/RefillPage";
import SpiralSettingPage from "./pages/SpiralSettingPage/SpiralSettingPage";
import MotorTestingPage from "./pages/MotorTestingPage/MotorTestingPage";
import ReportPage from "./pages/ReportPage/ReportPage";
import VendingPage from "./pages/VendingPage/VendingPage";
import ScanningPage from "./pages/ScanningPage/ScanningPage";
import UserRegisterPage from "./pages/UserRegisterPage/UserRegisterPage";
import TopupPage from "./pages/TopupPage/TopupPage";
import TopupPayingPage from "./pages/TopupPayingPage/TopupPayingPage";
import UserDetailsPage from "./pages/UserDetails/UserDetailsPage";
import AccountPage from "./pages/Account/AccountPage";
import PrinterSetupPage from "./pages/Printer/PrinterSetupPage";
import CardPage from "./pages/PineLabs/CardPage";
import machineidApi from "./services/machineidApi";
import paymentsettingApi from "./services/paymentsettingApi";

// Import theme
import { darkTheme } from "./utils/themes";

// Import CSS
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App() {
  const [appType, setAppType] = useState("VM");

  useEffect(() => {
    const machineGuid = localStorage.getItem("machine_id");

    if (!machineGuid) {
      console.error("No machine_id found in localStorage");
      return;
    }

    const sendStatus = (status) => {
      const payload = {
        Machine_Guid: machineGuid,
        Status: status,
      };
      machineidApi
        .regstatus(payload)
        .then(() => console.log(`Machine marked ${status}`))
        .catch((err) => console.error(`Failed to mark ${status}`, err));
    };

    // 1. Initial ONLINE
    sendStatus("online");

    // 2. Heartbeat every 30s
    const heartbeatInterval = setInterval(() => {
      sendStatus("online");
    }, 30000);

    // 3. On unload, mark OFFLINE
    const handleOffline = () => sendStatus("offline");
    window.addEventListener("beforeunload", handleOffline);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener("beforeunload", handleOffline);
      sendStatus("offline"); // Cleanup if React unmounts
    };
  }, []);

  useEffect(() => {
    const fetchIntialDatas = async () => {
      try {
        // const systemMacAddress=await window.electronAPI.getMacAddress();
        const systemMacAddress = "54BF6460D0D6";

        if (!systemMacAddress) {
          console.log("Critical could not read the Mac Adress");
        }

        const response = await machineidApi.getmachinedetails();

        if (response?.success && Array.isArray(response.data)) {
          console.log(
            `Received ${response.data.length} machines from the server.`
          );

          // STEP 4: Filter the list on the frontend to find the matching machine.
          const thisMachine = response.data.find(
            (machine) =>
              machine.Mac &&
              machine.Mac.toUpperCase() === systemMacAddress.toUpperCase()
          );

          if (thisMachine) {
            // We found a match!
            console.log(
              "SUCCESS: Matched system MAC to machine details:",
              thisMachine
            );

            // --- Now we set the values in localStorage from the matched machine ---
            localStorage.setItem("machine_id", thisMachine.Machine_Guid);
            localStorage.setItem("company_id", thisMachine.Company_id);
            localStorage.setItem("vendor_id", thisMachine.Vendor_id);
            localStorage.setItem("AppType", thisMachine.AppType);
            localStorage.setItem("PgSettingId",thisMachine.PgSettingId)
            localStorage.setItem("machine_name",thisMachine.Name)
            

            const newAppType = thisMachine.AppType || "VM";
            localStorage.setItem("AppType", newAppType);
            setAppType(newAppType); // Also update component state

            console.log("Machine identity established successfully!");

            // --- Proceed with other dependent calls ---
          } else {
            // The API returned a list of machines, but none matched the hardcoded MAC address.
            console.error(
              `Critical: The MAC address (${systemMacAddress}) is not registered on the server.`
            );
          }
        } else {
          console.error("could not get Machine list from the server");
        }
      } catch (error) {
        console.error("Error during machine identification:", error);
        const backendError =
          error.response?.data?.message ||
          "Failed to establish machine identity.";
      }
    };
    fetchIntialDatas();
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <Router>
          <div className="app">
            <Routes>
              <Route path="/" element={<Navigate to="/analyzing" replace />} />
              <Route path="/analyzing" element={<AnalyzingPage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/order" element={<OrderPage />} />
              <Route path="/payment" element={<SelectPaymentPage />} />
              <Route path="/paying" element={<PayingPage />} />
              <Route path="/pinelabs" element={<CardPage />} />
              <Route path="/vending" element={<VendingPage />} />
              <Route path="/bill" element={<OrderBillPage />} />
              <Route path="/operator" element={<OperatorPage />} />
              <Route path="/refill" element={<RefillPage />} />
              <Route path="/spiral-setting" element={<SpiralSettingPage />} />
              <Route path="/motor-testing" element={<MotorTestingPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/scanning-page" element={<ScanningPage />} />
              <Route path="/register" element={<UserRegisterPage />} />
              <Route path="/topup" element={<TopupPage />} />
              <Route path="/topup-pay" element={<TopupPayingPage />} />
              <Route path="/check-balance" element={<UserDetailsPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/printer-setup" element={<PrinterSetupPage />} />
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />
          </div>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
