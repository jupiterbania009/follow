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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { FaInstagram } from 'react-icons/fa';
import axiosInstance from '../config/axios.config';
import useAuthStore from '../store/authStore';

const InstagramConnect = ({ onSuccess, isConnected }) => {
  const [credentials, setCredentials] = useState({
    instagramUsername: '',
    instagramPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkpointData, setCheckpointData] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleConnect = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setCheckpointData(null);

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
      
      // Handle checkpoint required error
      if (error.response?.data?.error === 'checkpoint_required') {
        setCheckpointData(error.response.data.checkpoint);
        onOpen(); // Open verification modal
        toast({
          title: 'Security Check Required',
          description: error.response.data.message,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      } else {
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post('/instagram/verify', {
        code: verificationCode
      });

      if (response.data.success) {
        onClose(); // Close verification modal
        toast({
          title: 'Success!',
          description: 'Instagram account verified and connected successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        if (onSuccess) onSuccess(response.data);
        
        // Clear the verification code and checkpoint data
        setVerificationCode('');
        setCheckpointData(null);
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to verify code';
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
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
    <Box>
      <form onSubmit={handleConnect}>
        <VStack spacing={4} align="stretch">
          <HStack>
            <Icon as={FaInstagram} w={6} h={6} color="brand.500" />
            <Text fontSize="xl" fontWeight="bold">Connect Instagram</Text>
          </HStack>

          {error && (
            <Alert status="error">
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FormControl isRequired>
            <FormLabel>Instagram Username</FormLabel>
            <Input
              name="instagramUsername"
              value={credentials.instagramUsername}
              onChange={handleInputChange}
              placeholder="Enter your Instagram username"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Instagram Password</FormLabel>
            <Input
              name="instagramPassword"
              type="password"
              value={credentials.instagramPassword}
              onChange={handleInputChange}
              placeholder="Enter your Instagram password"
            />
          </FormControl>

          <Button
            type="submit"
            colorScheme="brand"
            isLoading={isLoading}
            loadingText="Connecting..."
          >
            Connect Instagram
          </Button>
        </VStack>
      </form>

      {/* Verification Code Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Instagram Verification Required</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Security Check</AlertTitle>
                  <AlertDescription>
                    Please enter the verification code sent to your {checkpointData?.type === 'email' ? 'email' : 'phone'} ({checkpointData?.contactPoint}).
                  </AlertDescription>
                </Box>
              </Alert>

              {error && (
                <Alert status="error">
                  <AlertIcon />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleVerificationSubmit} style={{ width: '100%' }}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Verification Code</FormLabel>
                    <Input
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter verification code"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="brand"
                    isLoading={isLoading}
                    loadingText="Verifying..."
                    width="100%"
                  >
                    Submit Verification
                  </Button>
                </VStack>
              </form>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default InstagramConnect; 
