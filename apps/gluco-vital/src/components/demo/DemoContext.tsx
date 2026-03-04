import React, { createContext, useContext, useState, useEffect } from "react";
import { generateDemoData, DEMO_USER_EMAIL } from "./DemoDataGenerator";

const DemoContext = createContext(null);

export function DemoProvider({ children }) {
  const [isDemo, setIsDemo] = useState(false);
  const [demoData, setDemoData] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const demoMode = urlParams.get('demo') === 'true';
    
    if (demoMode) {
      setIsDemo(true);
      setDemoData(generateDemoData());
    }
  }, []);

  return (
    <DemoContext.Provider value={{ isDemo, demoData, DEMO_USER_EMAIL }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    // Return default values if not wrapped in provider
    return { isDemo: false, demoData: null, DEMO_USER_EMAIL };
  }
  return context;
}

// Helper to check if current session is demo
export function isDemoMode() {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('demo') === 'true';
}