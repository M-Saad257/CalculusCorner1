import React from 'react';
import { Navigate } from 'react-router-dom';
import { useContent } from '../context/ContentContext';

const VisibilityRoute = ({ feature, children }) => {
  const { content, loading } = useContent();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-bg-color"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const visibility = content?.visibility || {};
  
  if (visibility[feature] === false) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default VisibilityRoute;
