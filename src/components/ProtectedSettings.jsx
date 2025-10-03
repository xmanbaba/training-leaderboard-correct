// src/components/ProtectedSettings.jsx
import React from "react";
import RoleGuard from "./RoleGuard";
import Settings from "./Settings";

const ProtectedSettings = (props) => {
  return (
    <RoleGuard requireAdmin={true}>
      <Settings {...props} />
    </RoleGuard>
  );
};

export default ProtectedSettings;
