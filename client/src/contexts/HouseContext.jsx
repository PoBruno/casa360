import React, { createContext, useState, useEffect } from 'react';

export const HouseContext = createContext();

export const HouseProvider = ({ children }) => {
  const [selectedHouseId, setSelectedHouseId] = useState(
    localStorage.getItem('selectedHouseId') || null
  );

  const selectHouse = (houseId) => {
    localStorage.setItem('selectedHouseId', houseId);
    setSelectedHouseId(houseId);
  };

  const clearSelectedHouse = () => {
    localStorage.removeItem('selectedHouseId');
    setSelectedHouseId(null);
  };

  return (
    <HouseContext.Provider value={{ 
      selectedHouseId,
      selectHouse, 
      clearSelectedHouse
    }}>
      {children}
    </HouseContext.Provider>
  );
};