
import React from "react";
import { Routes, Route } from "react-router-dom";

import Dashboard from "../components/Dashboard";
import AllBookmarks from "../components/AllBookmarks";
import Starred from "../components/Starred";
import SystemHealth from "../components/SystemHealth";
import MCP from "../components/MCP";
import About from "../components/About";
import Login from "../components/Login";

import Recent from "../components/Recent";
import RemindMe from "../components/RemindMe";

const MainRouter = () => (
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/recent" element={<Recent />} />
    <Route path="/allbookmarks" element={<AllBookmarks />} />
    <Route path="/remindme" element={<RemindMe />} />
    <Route path="/starred" element={<Starred />} />
    <Route path="/systemhealth" element={<SystemHealth />} />
    <Route path="/mcp" element={<MCP />} />
    <Route path="/about" element={<About />} />
    <Route path="/login" element={<Login />} />
    <Route path="*" element={<Dashboard />} />
  </Routes>
);

export default MainRouter;
