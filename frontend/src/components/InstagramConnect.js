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
  const toast = useToast();

  const handleConnect = async (e) => {
    e.preventDefault();
    setIsLoading(true);

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
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to connect Instagram account',
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
