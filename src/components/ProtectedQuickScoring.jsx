// src/components/ProtectedQuickScoring.jsx
import React from "react";
import RoleGuard from "./RoleGuard";
import QuickScoring from "./QuickScoring";

const ProtectedQuickScoring = (props) => {
  return (
    <RoleGuard requireAdmin={true}>
      <QuickScoring {...props} />
    </RoleGuard>
  );
};

export default ProtectedQuickScoring;
