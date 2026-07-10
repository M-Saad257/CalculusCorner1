import { createContext, useState, useEffect, useContext } from 'react';
import { useSocket } from '../hooks/useSocket';

const ContentContext = createContext();

export const useContent = () => useContext(ContentContext);

/**
 * Appends a cache-busting query parameter to a logo_url so browsers never
 * serve a stale logo after an admin uploads a new one.
 * @param {Object} logoData  - { logo_url: string, ... }
 * @returns {Object}
 */
const bustLogoCache = (logoData) => {
  if (!logoData?.logo_url) return logoData;
  // Strip any previous ?v= param before appending a fresh timestamp
  const baseUrl = logoData.logo_url.replace(/([?&])v=\d+/, '');
  const separator = baseUrl.includes('?') ? '&' : '?';
  return {
    ...logoData,
    logo_url: `${baseUrl}${separator}v=${Date.now()}`
  };
};

export const ContentProvider = ({ children }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/content');
      if (!res.ok) throw new Error('Failed to fetch site content');
      const json = await res.json();
      // Apply cache-busting to the logo on initial load
      const data = json.data;
      if (data?.logo) {
        data.logo = bustLogoCache(data.logo);
      }
      setContent(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  // Listen for logo updates via DOM events (same-tab upload)
  useEffect(() => {
    const handleLogoUpdate = (event) => {
      const logoData = bustLogoCache(event.detail);
      setContent((prev) => ({
        ...(prev || {}),
        logo: logoData
      }));
    };
    window.addEventListener('logo:updated', handleLogoUpdate);
    return () => window.removeEventListener('logo:updated', handleLogoUpdate);
  }, []);

  // Listen for global socket updates for CMS content
  const { socket } = useSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    const handleGlobalUpdate = () => {
      fetchContent();
    };

    socket.on('site:content-update', handleGlobalUpdate);
    socket.on('site:logo-update', handleGlobalUpdate);

    return () => {
      socket.off('site:content-update', handleGlobalUpdate);
      socket.off('site:logo-update', handleGlobalUpdate);
    };
  }, [socket]);


  const updateSection = async (sectionName, newData) => {
    try {
      const res = await fetch(`/api/content/${sectionName}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newData)
      });
      if (res.ok) {
        // Optimistically update context
        setContent(prev => ({
          ...prev,
          [sectionName]: newData
        }));
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  return (
    <ContentContext.Provider value={{ content, loading, error, updateSection, refetch: fetchContent }}>
      <SocketLogoSync setContent={setContent}>
        {children}
      </SocketLogoSync>
    </ContentContext.Provider>
  );
};

/**
 * Inner component that subscribes to the socket logo-update event.
 * Placed inside ContentProvider so it can use useSocket (which requires SocketProvider).
 * This makes logo changes propagate to ALL open browser sessions in real-time.
 */
const SocketLogoSync = ({ setContent, children }) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleLogoUpdate = (logoData) => {
      // Apply cache-busting so all tabs serve the fresh logo immediately
      const bustedLogo = bustLogoCache(logoData);
      setContent(prev => ({
        ...(prev || {}),
        logo: bustedLogo
      }));
    };

    socket.on('site:logo-update', handleLogoUpdate);

    const handleContentUpdate = ({ sectionName, contentData }) => {
      setContent(prev => ({
        ...(prev || {}),
        [sectionName]: contentData
      }));
    };

    socket.on('site:content-update', handleContentUpdate);

    return () => {
      socket.off('site:logo-update', handleLogoUpdate);
      socket.off('site:content-update', handleContentUpdate);
    };
  }, [socket, setContent]);

  return children;
};
