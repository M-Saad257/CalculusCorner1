import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Download, FileText } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import api from '../services/api';
import Button from '../components/ui/Button';



const deriveSizeLabel = (url = '') => {
  const lower = url.toLowerCase();
  if (lower.endsWith('.pdf')) return 'PDF';
  if (lower.endsWith('.docx')) return 'DOCX';
  if (lower.endsWith('.pptx') || lower.endsWith('.ppt')) return 'PPT';
  if (lower.endsWith('.xlsx')) return 'XLSX';
  if (lower.endsWith('.zip')) return 'ZIP';
  return 'File';
};

const ResourceLibraryPage = () => {
  const [resources, setResources] = useState([]);

  useEffect(() => {
    const loadResources = async () => {
      try {
        const res = await api.get('/resources');
        if (res.data && Array.isArray(res.data.data)) {
          setResources(res.data.data);
        }
      } catch (err) {
      }
    };

    loadResources();
  }, []);

  const categories = useMemo(() => {
    return resources.reduce((acc, resource) => {
      const category = resource.category || 'General';
      if (!acc[category]) acc[category] = [];
      acc[category].push(resource);
      return acc;
    }, {});
  }, [resources]);

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 py-25 text-center flex flex-col gap-10">
        <div className="flex flex-col gap-4 mb-10">
          <div className="">
            <span className="inline-block text-xs uppercase font-extrabold tracking-widest text-primary mb-3">Resource Library</span>
            <h1 className="font-display font-bold text-4xl md:text-5xl text-text-primary leading-tight mb-4">Browse all resources by category</h1>
          <p className="text-base md:text-lg text-text-secondary leading-relaxed">
            Access all available study files organized by category and topic so you can quickly find the right material.
          </p>
        </div>
        <Button
          variant="outline"
          className="self-center px-5 py-2.5 text-sm shrink-0"
          onClick={() => window.location.href = '/resources'}
        >
          Back to Dashboard Resources
        </Button>
      </div>

      {Object.keys(categories).length === 0 ? (
        <div className="rounded-3xl bg-bg-color border border-border-color p-8 text-text-secondary text-sm">
          No resources available at the moment.
        </div>
      ) : (
        <div className="grid gap-10">
          {Object.entries(categories).map(([category, items]) => (
            <div key={category} className="bg-bg-color border border-border-color rounded-3xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <div>
                  <h2 className="font-display font-bold text-2xl text-text-primary">{category}</h2>
                  <p className="text-text-secondary text-sm mt-1">{items.length} resource{items.length === 1 ? '' : 's'} available</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="px-4 py-2 text-sm"
                    onClick={() => window.location.href = `/resources?category=${encodeURIComponent(category)}`}
                  >
                    View {category}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {items.map((resource) => (
                  <div key={resource.id} className="flex flex-col rounded-2xl border border-border-color p-5 gap-4 bg-bg-secondary">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-lg text-text-primary">{resource.title}</h3>
                          <p className="text-xs text-text-secondary">{deriveSizeLabel(resource.original_filename || resource.file_url || '')}</p>
                        </div>
                      </div>
                      <a
                        href={resource.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-primary font-bold text-sm"
                      >
                        <Download size={16} />
                        Download
                      </a>
                    </div>
                    <p className="text-text-secondary text-sm line-clamp-2">{resource.original_filename || resource.file_url}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    <Footer />
    </>
  );
};

export default ResourceLibraryPage;
