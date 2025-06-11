import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner, Center } from '@chakra-ui/react';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children }) => {
  const { token, user, getCurrentUser } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (token && !user) {
      getCurrentUser();
    }
  }, [token, user, getCurrentUser]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (token && !user) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  return children;
};

export default ProtectedRoute; 