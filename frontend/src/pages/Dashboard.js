import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Avatar,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  SimpleGrid,
  Card,
  CardBody,
} from '@chakra-ui/react';
import useAuthStore from '../store/authStore';
import useFollowStore from '../store/followStore';

const UserCard = ({ user, onFollow }) => (
  <Card>
    <CardBody>
      <HStack spacing={4}>
        <Avatar name={user.username} size="md" />
        <Box flex="1">
          <Text fontWeight="bold">{user.username}</Text>
          <Text fontSize="sm" color="gray.500">
            {user.followersCount} followers
          </Text>
        </Box>
        <Button onClick={() => onFollow(user._id)} size="sm">
          Follow
        </Button>
      </HStack>
    </CardBody>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuthStore();
  const {
    suggestions,
    followers,
    following,
    getFollowSuggestions,
    getFollowers,
    getFollowing,
    followUser,
    isLoading,
  } = useFollowStore();
  const toast = useToast();

  useEffect(() => {
    getFollowSuggestions();
    if (user) {
      getFollowers(user._id);
      getFollowing(user._id);
    }
  }, [user, getFollowSuggestions, getFollowers, getFollowing]);

  const handleFollow = async (userId) => {
    const result = await followUser(userId);
    if (result) {
      toast({
        title: 'Successfully followed user',
        description: `You earned 1 point!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={8}>
      {/* User Stats */}
      <GridItem colSpan={{ base: 1, md: 3 }}>
        <Card>
          <CardBody>
            <StatGroup>
              <Stat>
                <StatLabel>Points</StatLabel>
                <StatNumber>{user?.points || 0}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Followers</StatLabel>
                <StatNumber>{user?.followersCount || 0}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Following</StatLabel>
                <StatNumber>{user?.followingCount || 0}</StatNumber>
              </Stat>
            </StatGroup>
          </CardBody>
        </Card>
      </GridItem>

      {/* Follow Suggestions */}
      <GridItem colSpan={{ base: 1, md: 2 }}>
        <VStack align="stretch" spacing={4}>
          <Heading size="md">Suggested Users to Follow</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {suggestions.map((suggestion) => (
              <UserCard
                key={suggestion._id}
                user={suggestion}
                onFollow={handleFollow}
              />
            ))}
          </SimpleGrid>
        </VStack>
      </GridItem>

      {/* Activity Feed */}
      <GridItem>
        <VStack align="stretch" spacing={4}>
          <Heading size="md">Recent Activity</Heading>
          <Card>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                {followers.slice(0, 5).map((follow) => (
                  <HStack key={follow._id}>
                    <Avatar size="sm" name={follow.follower.username} />
                    <Text fontSize="sm">
                      <Text as="span" fontWeight="bold">
                        {follow.follower.username}
                      </Text>{' '}
                      started following you
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </GridItem>
    </Grid>
  );
};

export default Dashboard; 