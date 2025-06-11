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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const { register, isLoading, error, clearError } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const { username, email, password } = formData;
    const success = await register({ username, email, password });

    if (success) {
      toast({
        title: 'Registration successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard');
    } else {
      toast({
        title: 'Registration failed',
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
          <Heading color="brand.500">Create Account</Heading>
          <Text mt={2} color="gray.600">
            Join InstaFollowX and start growing your following
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
              <FormLabel>Username</FormLabel>
              <Input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
              />
            </FormControl>

            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              width="full"
              isLoading={isLoading}
            >
              Sign Up
            </Button>
          </VStack>
        </Box>

        <Text textAlign="center">
          Already have an account?{' '}
          <Link as={RouterLink} to="/login" color="brand.500">
            Login
          </Link>
        </Text>
      </VStack>
    </Container>
  );
};

export default Register; 