/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <main className="flex-grow">{children}</main>
    </div>
  );
};

export default Layout;