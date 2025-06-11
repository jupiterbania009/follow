import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Container,
  Heading,
  Link,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const success = await login({ email, password });
    if (success) {
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from);
    } else {
      toast({
        title: 'Login failed',
        description: error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading color="brand.500">Welcome Back</Heading>
          <Text mt={2} color="gray.600">
            Login to continue growing your following
          </Text>
        </Box>

        <Box
          as="form"
          onSubmit={handleSubmit}
          bg="white"
          p={8}
          borderRadius="lg"
          boxShadow="sm"
        >
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              width="full"
              isLoading={isLoading}
            >
              Login
            </Button>
          </VStack>
        </Box>

        <Text textAlign="center">
          Don't have an account?{' '}
          <Link as={RouterLink} to="/register" color="brand.500">
            Sign up
          </Link>
        </Text>
      </VStack>
    </Container>
  );
};

export default Login; 