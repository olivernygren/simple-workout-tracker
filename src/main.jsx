import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./ui/Layout.jsx";
import { StorageProvider } from "./utils/storageContext.jsx";
import Programs from "./pages/Programs.jsx";
import ProgramDetail from "./pages/ProgramDetail.jsx";
import WorkoutDetail from "./pages/WorkoutDetail.jsx";
import "./styles.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Programs /> },
      { path: "program/:pid", element: <ProgramDetail /> },
      { path: "workout/:wid", element: <WorkoutDetail /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <StorageProvider>
      <RouterProvider router={router} />
    </StorageProvider>
  </React.StrictMode>
);
