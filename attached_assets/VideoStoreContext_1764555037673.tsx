import { createContext, useContext, useState, ReactNode } from 'react';

interface Episode {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoType: 'vimeo' | 'youtube';
  price: number;
  thumbnail: string;
}

interface Series {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  episodes: Episode[];
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface VideoStoreContextType {
  series: Series[];
  addSeries: (series: Omit<Series, 'id' | 'episodes'>) => void;
  addEpisode: (seriesId: string, episode: Omit<Episode, 'id'>) => void;
  updateSeries: (seriesId: string, updates: Partial<Series>) => void;
  purchasedEpisodes: string[];
  purchaseEpisode: (episodeId: string) => void;
  user: User | null;
  login: (email: string, password: string) => void;
  logout: () => void;
}

const VideoStoreContext = createContext<VideoStoreContextType | undefined>(undefined);

// Mock initial data
const initialSeries: Series[] = [
  {
    id: '1',
    title: 'Web Development Masterclass',
    description: 'Learn modern web development from scratch with hands-on projects and real-world applications.',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop',
    episodes: [
      {
        id: '1-1',
        title: 'Introduction to HTML & CSS',
        description: 'Get started with the fundamentals of web development.',
        videoUrl: 'https://vimeo.com/76979871',
        videoType: 'vimeo',
        price: 9.99,
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop'
      },
      {
        id: '1-2',
        title: 'JavaScript Essentials',
        description: 'Master the core concepts of JavaScript programming.',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoType: 'youtube',
        price: 12.99,
        thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=300&fit=crop'
      }
    ]
  },
  {
    id: '2',
    title: 'Creative Photography Course',
    description: 'Transform your photography skills with professional techniques and creative composition strategies.',
    thumbnail: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=600&fit=crop',
    episodes: [
      {
        id: '2-1',
        title: 'Camera Basics',
        description: 'Understanding your camera settings and controls.',
        videoUrl: 'https://vimeo.com/76979871',
        videoType: 'vimeo',
        price: 14.99,
        thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop'
      }
    ]
  },
  {
    id: '3',
    title: 'Digital Marketing Strategy',
    description: 'Build comprehensive marketing campaigns that drive results and grow your business online.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    episodes: [
      {
        id: '3-1',
        title: 'Social Media Marketing',
        description: 'Leverage social platforms for business growth.',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoType: 'youtube',
        price: 11.99,
        thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop'
      }
    ]
  }
];

export function VideoStoreProvider({ children }: { children: ReactNode }) {
  const [series, setSeries] = useState<Series[]>(initialSeries);
  const [purchasedEpisodes, setPurchasedEpisodes] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const addSeries = (newSeries: Omit<Series, 'id' | 'episodes'>) => {
    const series: Series = {
      ...newSeries,
      id: Date.now().toString(),
      episodes: []
    };
    setSeries(prev => [...prev, series]);
  };

  const addEpisode = (seriesId: string, newEpisode: Omit<Episode, 'id'>) => {
    setSeries(prev => prev.map(s => {
      if (s.id === seriesId) {
        const episode: Episode = {
          ...newEpisode,
          id: `${seriesId}-${Date.now()}`
        };
        return {
          ...s,
          episodes: [...s.episodes, episode]
        };
      }
      return s;
    }));
  };

  const updateSeries = (seriesId: string, updates: Partial<Series>) => {
    setSeries(prev => prev.map(s => s.id === seriesId ? { ...s, ...updates } : s));
  };

  const purchaseEpisode = (episodeId: string) => {
    setPurchasedEpisodes(prev => [...prev, episodeId]);
  };

  const login = (email: string, password: string) => {
    // Mock login
    setUser({
      id: '1',
      email,
      name: email.split('@')[0]
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <VideoStoreContext.Provider value={{
      series,
      addSeries,
      addEpisode,
      updateSeries,
      purchasedEpisodes,
      purchaseEpisode,
      user,
      login,
      logout
    }}>
      {children}
    </VideoStoreContext.Provider>
  );
}

export function useVideoStore() {
  const context = useContext(VideoStoreContext);
  if (!context) {
    throw new Error('useVideoStore must be used within VideoStoreProvider');
  }
  return context;
}
