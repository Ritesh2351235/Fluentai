/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Dashboard from './components/Dashboard'
import Landingpage from './components/Landingpage'
import Readingsec from './components/Readingsec'
import Writingsec from './components/Writingsec'
import Speaking from './components/Speaking'

const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
  </div>
);

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Landingpage />
            </PageTransition>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PageTransition>
              <Dashboard />
            </PageTransition>
          }
        />
        <Route
          path="/reading"
          element={
            <PageTransition>
              <Readingsec />
            </PageTransition>
          }
        />
        <Route
          path="/writing"
          element={
            <PageTransition>
              <Writingsec />
            </PageTransition>
          }
        />
        <Route
          path="/speaking"
          element={
            <PageTransition>
              <Speaking />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

export default function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}