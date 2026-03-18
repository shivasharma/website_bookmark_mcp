import React from "react";
import { Outlet } from "react-router-dom";

const Main = () => (
  <main className="flex-1 overflow-y-auto bg-background">
    <div className="p-6 md:p-8 lg:p-10 min-h-full">
      <Outlet />
    </div>
  </main>
);

export default Main;
