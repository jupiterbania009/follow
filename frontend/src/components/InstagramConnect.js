import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Text,
  Icon,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FaInstagram } from 'react-icons/fa';
import axiosInstance from '../config/axios.config';
import useAuthStore from '../store/authStore';

const InstagramConnect = ({ onSuccess, isConnected }) => {
  const [credentials, setCredentials] = useState({
    instagramUsername: '',
    instagramPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const handleConnect = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post('/instagram/connect', credentials);
      
      if (response.data.success) {
        toast({
          title: 'Success!',
          description: 'Instagram account connected successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        if (onSuccess) onSuccess(response.data);
        
        // Clear the form
        setCredentials({
          instagramUsername: '',
          instagramPassword: '',
        });
      }
    } catch (error) {
      console.error('Instagram connection error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError(null);
  };

  if (isConnected) {
    return (
      <Box p={4} borderRadius="lg" borderWidth="1px">
        <HStack spacing={3}>
          <Icon as={FaInstagram} color="pink.500" boxSize={6} />
          <Text color="green.500" fontWeight="medium">
            Instagram Account Connected
          </Text>
        </HStack>
      </Box>
    );
  }

  return (
    <Box as="form" onSubmit={handleConnect} p={4} borderRadius="lg" borderWidth="1px">
      <VStack spacing={4}>
        <HStack spacing={3}>
          <Icon as={FaInstagram} color="pink.500" boxSize={6} />
          <Text fontSize="lg" fontWeight="medium">
            Connect Instagram Account
          </Text>
        </HStack>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        )}
        
        <FormControl>
          <FormLabel>Instagram Username</FormLabel>
          <Input
            name="instagramUsername"
            value={credentials.instagramUsername}
            onChange={handleChange}
            placeholder="Enter your Instagram username"
            required
          />
        </FormControl>

        <FormControl>
          <FormLabel>Instagram Password</FormLabel>
          <Input
            name="instagramPassword"
            type="password"
            value={credentials.instagramPassword}
            onChange={handleChange}
            placeholder="Enter your Instagram password"
            required
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="pink"
          width="full"
          isLoading={isLoading}
          loadingText="Connecting..."
        >
          Connect Instagram
        </Button>
      </VStack>
    </Box>
  );
};

export default InstagramConnect; 
