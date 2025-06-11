import React from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Icon,
  useColorModeValue,
  HStack,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaUsers, FaChartLine, FaStar, FaExchangeAlt } from 'react-icons/fa';

const Feature = ({ icon, title, description }) => {
  const bg = useColorModeValue('white', 'gray.800');
  return (
    <Box
      bg={bg}
      p={6}
      borderRadius="lg"
      boxShadow="sm"
      _hover={{ transform: 'translateY(-5px)', transition: '0.3s' }}
    >
      <Icon as={icon} w={10} h={10} color="brand.500" mb={4} />
      <Heading size="md" mb={2}>
        {title}
      </Heading>
      <Text color="gray.600">{description}</Text>
    </Box>
  );
};

const Home = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box bg="brand.500" color="white" py={20}>
        <Container maxW="container.xl">
          <VStack spacing={6} align="center" textAlign="center">
            <Heading size="2xl">
              Grow Your Social Following with InstaFollowX
            </Heading>
            <Text fontSize="xl" maxW="container.md">
              Join our community of users who help each other grow. Follow others
              and earn points to get real, engaged followers in return.
            </Text>
            <HStack spacing={4}>
              <Button
                as={RouterLink}
                to="/register"
                size="lg"
                colorScheme="white"
                variant="solid"
                bg="white"
                color="brand.500"
                _hover={{ bg: 'gray.100' }}
              >
                Get Started
              </Button>
              <Button
                as={RouterLink}
                to="/login"
                size="lg"
                variant="outline"
                borderColor="white"
                _hover={{ bg: 'brand.600' }}
              >
                Login
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="container.xl" py={20}>
        <VStack spacing={12}>
          <Heading textAlign="center" mb={4}>
            How It Works
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
            <Feature
              icon={FaUsers}
              title="Follow Users"
              description="Follow other users in our community to earn points and grow your network."
            />
            <Feature
              icon={FaChartLine}
              title="Earn Points"
              description="Get 1 point for each user you follow. Points can be redeemed for followers."
            />
            <Feature
              icon={FaExchangeAlt}
              title="Exchange System"
              description="Use your points to get real followers who are interested in your content."
            />
            <Feature
              icon={FaStar}
              title="Quality Network"
              description="Connect with active users and build a genuine, engaged following."
            />
          </SimpleGrid>
        </VStack>
      </Container>

      {/* CTA Section */}
      <Box bg="gray.50" py={20}>
        <Container maxW="container.xl">
          <VStack spacing={6} align="center" textAlign="center">
            <Heading>Ready to Grow Your Following?</Heading>
            <Text fontSize="lg" maxW="container.md" color="gray.600">
              Join thousands of users who are already growing their social presence
              with InstaFollowX.
            </Text>
            <Button
              as={RouterLink}
              to="/register"
              size="lg"
              colorScheme="brand"
              px={8}
            >
              Start Growing Today
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 