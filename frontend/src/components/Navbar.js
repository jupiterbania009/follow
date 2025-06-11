import React from 'react';
import {
  Box,
  Flex,
  Button,
  Text,
  HStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box bg={bgColor} px={4} borderBottom={1} borderStyle="solid" borderColor={borderColor}>
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <RouterLink to="/">
          <Text fontSize="xl" fontWeight="bold" color="brand.500">
            InstaFollowX
          </Text>
        </RouterLink>

        <HStack spacing={4}>
          {user ? (
            <>
              <Text color="gray.600">Points: {user.points}</Text>
              <Menu>
                <MenuButton
                  as={Button}
                  rounded="full"
                  variant="link"
                  cursor="pointer"
                  minW={0}
                >
                  <Avatar size="sm" name={user.username} />
                </MenuButton>
                <MenuList>
                  <MenuItem as={RouterLink} to="/dashboard">
                    Dashboard
                  </MenuItem>
                  <MenuItem onClick={logout}>Logout</MenuItem>
                </MenuList>
              </Menu>
            </>
          ) : (
            <>
              <Button as={RouterLink} to="/login" variant="ghost">
                Login
              </Button>
              <Button as={RouterLink} to="/register">
                Sign Up
              </Button>
            </>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar; 