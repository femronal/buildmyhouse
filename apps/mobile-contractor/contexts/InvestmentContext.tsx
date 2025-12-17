import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UserInvestment {
  id: number;
  name: string;
  invested: number;
  currentValue: number;
  roi: string;
  status: string;
  maturity: string;
  units: number;
  investmentDate: string;
}

interface InvestmentContextType {
  userInvestments: UserInvestment[];
  addInvestment: (investment: {
    id: number;
    name: string;
    minInvestment: number;
    roi: string;
    duration: string;
  }, units: number) => void;
  getTotalInvested: () => number;
  getTotalCurrentValue: () => number;
}

const InvestmentContext = createContext<InvestmentContextType | undefined>(undefined);

// Initial investments (pre-existing)
const initialInvestments: UserInvestment[] = [
  { id: 1, name: "Lekki Gardens Phase 3", invested: 15000, currentValue: 16800, roi: "12%", status: "active", maturity: "Dec 2025", units: 3, investmentDate: "Jun 2024" },
  { id: 2, name: "Abuja Smart City", invested: 25000, currentValue: 28500, roi: "14%", status: "active", maturity: "Jun 2026", units: 2, investmentDate: "Mar 2024" },
];

export function InvestmentProvider({ children }: { children: ReactNode }) {
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>(initialInvestments);

  const addInvestment = (investment: {
    id: number;
    name: string;
    minInvestment: number;
    roi: string;
    duration: string;
  }, units: number) => {
    const totalAmount = investment.minInvestment * units;
    
    // Check if user already has this investment
    const existingIndex = userInvestments.findIndex(inv => inv.name === investment.name);
    
    if (existingIndex >= 0) {
      // Update existing investment
      setUserInvestments(prev => prev.map((inv, index) => {
        if (index === existingIndex) {
          const newInvested = inv.invested + totalAmount;
          const newUnits = inv.units + units;
          return {
            ...inv,
            invested: newInvested,
            currentValue: newInvested, // New investments start at invested value
            units: newUnits,
          };
        }
        return inv;
      }));
    } else {
      // Add new investment
      const maturityDate = new Date();
      const durationMonths = parseInt(investment.duration) || 24;
      maturityDate.setMonth(maturityDate.getMonth() + durationMonths);
      const maturityStr = maturityDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const newInvestment: UserInvestment = {
        id: Date.now(),
        name: investment.name,
        invested: totalAmount,
        currentValue: totalAmount,
        roi: "0%", // New investment, no returns yet
        status: "active",
        maturity: maturityStr,
        units: units,
        investmentDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      };
      
      setUserInvestments(prev => [...prev, newInvestment]);
    }
  };

  const getTotalInvested = () => {
    return userInvestments.reduce((sum, inv) => sum + inv.invested, 0);
  };

  const getTotalCurrentValue = () => {
    return userInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
  };

  return (
    <InvestmentContext.Provider value={{ userInvestments, addInvestment, getTotalInvested, getTotalCurrentValue }}>
      {children}
    </InvestmentContext.Provider>
  );
}

export function useInvestments() {
  const context = useContext(InvestmentContext);
  if (context === undefined) {
    throw new Error('useInvestments must be used within an InvestmentProvider');
  }
  return context;
}
