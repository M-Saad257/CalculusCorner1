import { useEffect } from 'react';
import { useContent } from '../context/ContentContext';

const DynamicFavicon = () => {
  const { content } = useContent();

  useEffect(() => {
    let finalUrl = '/official.png'; // Default fallback

    if (content?.logo?.logo_url) {
      finalUrl = content.logo.logo_url;
      if (finalUrl.startsWith('/uploads')) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
        finalUrl = `${backendUrl}${finalUrl}`;
      }
    }

    // Force the browser to bypass cache when the logo updates
    finalUrl = `${finalUrl}?v=${new Date().getTime()}`;

    const links = document.querySelectorAll("link[rel~='icon']");
    if (links.length > 0) {
      links.forEach(link => {
        link.href = finalUrl;
      });
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = finalUrl;
      document.head.appendChild(newLink);
    }
  }, [content?.logo?.logo_url]);

  return null; // This component doesn't render anything visible
};

export default DynamicFavicon;
