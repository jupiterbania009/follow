import create from 'zustand';
import axios from 'axios';
import API_URL from '../config/api.config';

const useFollowStore = create((set, get) => ({
  suggestions: [],
  followers: [],
  following: [],
  isLoading: false,
  error: null,

  getFollowSuggestions: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/follow/suggestions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ suggestions: response.data.suggestions, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error fetching suggestions',
        isLoading: false,
      });
    }
  },

  followUser: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/follow/${userId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Remove user from suggestions
      const suggestions = get().suggestions.filter(user => user._id !== userId);
      set({ suggestions, isLoading: false });
      
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error following user',
        isLoading: false,
      });
      return null;
    }
  },

  unfollowUser: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/follow/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Remove user from following list
      const following = get().following.filter(user => user._id !== userId);
      set({ following, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error unfollowing user',
        isLoading: false,
      });
    }
  },

  getFollowers: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/follow/followers/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ followers: response.data.followers, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error fetching followers',
        isLoading: false,
      });
    }
  },

  getFollowing: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/follow/following/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ following: response.data.following, isLoading: false });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error fetching following',
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useFollowStore; 