import React, { useState } from 'react';
import { FiDownload, FiPlay, FiBookOpen, FiCheckCircle, FiChevronRight, FiX } from 'react-icons/fi';

const getVideoId = (url) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : '';
};

const VideoModal = ({ videoUrl, onClose }) => {

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        >
          <FiX className="w-6 h-6" />
        </button>
        <div className="relative pt-[56.25%]">
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${getVideoId(videoUrl)}?autoplay=1`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
};

const categories = [
  { id: 'segregation', label: 'Waste Segregation', icon: '🗑️' },
  { id: 'recycling', label: 'Recycling Guide', icon: '♻️' },
  { id: 'composting', label: 'Composting Tips', icon: '🌱' },
  { id: 'hazardous', label: 'Hazardous Waste', icon: '⚠️' },
];

const materials = {
  segregation: [
    {
      title: 'Proper Waste Segregation Guide',
      type: 'pdf',
      size: '2.5 MB',
      description: 'Learn how to properly segregate your household waste',
      pdfUrl: 'http://localhost:5173/materials/pdf/proper-waste-management-guide.pdf',
    },
    {
      title: 'Waste Segregation Tutorial',
      type: 'video',
      duration: '3:41',
      description: 'Learn how to properly segregate different types of waste',
      videoUrl: 'https://www.youtube.com/watch?v=0ZiD_Lb3Tm0',
    },
  ],
  recycling: [
    {
      title: 'Recyclable Materials Chart',
      type: 'pdf',
      size: '1.8 MB',
      description: 'Complete chart of recyclable materials',
      pdfUrl: '/materials/pdf/recyclable-materials-chart.pdf',
    },
    {
      title: 'Home Recycling Tips',
      type: 'video',
      duration: '4:52',
      description: 'Easy ways to recycle at home',
      videoUrl: 'https://youtu.be/TRg-tPFbG0g',
    },
  ],
  composting: [
    {
      title: 'Backyard Composting Guide',
      type: 'pdf',
      size: '3.1 MB',
      description: 'Start your own compost pile',
      pdfUrl: '/materials/pdf/backyard-composting-guide.pdf',
    },
    {
      title: 'Vermicomposting Tutorial',
      type: 'video',
      duration: '4:16',
      description: 'Learn vermicomposting techniques',
      videoUrl: 'https://youtu.be/SUCVPkvRdRw',
    },
  ],
  hazardous: [
    {
      title: 'Hazardous Waste Handling',
      type: 'pdf',
      size: '2.2 MB',
      description: 'Safety guidelines for hazardous materials',
      pdfUrl: '/materials/pdf/hazardous-waste-handling.pdf',
    },
    {
      title: 'Chemical Waste Disposal',
      type: 'video',
      duration: '5:07',
      description: 'Learn the proper way to dispose of chemical waste safely',
      videoUrl: 'https://youtu.be/lnTHEmavvgM',
    },
  ],
};

export default function IEC() {
  const [selectedCategory, setSelectedCategory] = useState('segregation');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  // Collect all videos from materials
  const allVideos = Object.values(materials)
    .flat()
    .filter(material => material.type === 'video');

  // Auto rotate featured video every 5 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {
      setFeaturedIndex((current) => (current + 1) % allVideos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleDownload = (material) => {
    if (!material.pdfUrl) {
      alert('PDF file not available yet. Please check back later.');
      return;
    }

    // Check if file exists first
    fetch(material.pdfUrl)
      .then(response => {
        if (response.ok) {
          // File exists, proceed with download
          window.open(material.pdfUrl, '_blank');
        } else {
          throw new Error('PDF file not found');
        }
      })
      .catch(error => {
        console.error('Error accessing file:', error);
        alert('The PDF file is not available at the moment. Please try again later.');
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {selectedVideo && (
          <VideoModal videoUrl={selectedVideo} onClose={() => setSelectedVideo(null)} />
        )}
        {/* Header */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Information & Education Campaign</h1>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed">Access comprehensive educational materials about proper waste management and environmental care.</p>
        </div>

        {/* Featured Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-3 md:p-6 mb-6 md:mb-8 text-white relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <div className="flex-1 w-full">
              <h2 className="text-lg md:text-2xl font-bold mb-1 md:mb-2 line-clamp-2">{allVideos[featuredIndex].title}</h2>
              <p className="mb-3 md:mb-4 text-green-100 text-sm md:text-base line-clamp-2">{allVideos[featuredIndex].description}</p>
              <button 
                onClick={() => setSelectedVideo(allVideos[featuredIndex].videoUrl)}
                className="bg-white text-green-700 px-3 md:px-6 py-1.5 md:py-2 rounded-lg font-semibold flex items-center gap-1.5 md:gap-2 hover:bg-green-50 transition-colors text-sm md:text-base w-full md:w-auto justify-center md:justify-start"
              >
                <FiPlay className="w-3 h-3" />
                Watch Video
              </button>
            </div>
            <div className="w-full md:w-1/3 aspect-video rounded-lg md:rounded overflow-hidden relative group cursor-pointer shadow-lg"
              onClick={() => setSelectedVideo(allVideos[featuredIndex].videoUrl)}
            >
              <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                <FiPlay className="w-8 h-8 md:w-12 md:h-12 text-white opacity-90" />
              </div>
              <img 
                src={`https://img.youtube.com/vi/${getVideoId(allVideos[featuredIndex].videoUrl)}/maxresdefault.jpg`}
                alt={`${allVideos[featuredIndex].title} thumbnail`}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
          {/* Carousel Navigation */}
          <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 md:gap-2">
            {allVideos.map((_, index) => (
              <button
                key={index}
                onClick={() => setFeaturedIndex(index)}
                className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 ${
                  index === featuredIndex 
                    ? 'bg-white scale-100' 
                    : 'bg-white/50 scale-75 hover:scale-90 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          {/* Previous/Next buttons */}
          <button
            onClick={() => setFeaturedIndex((current) => (current - 1 + allVideos.length) % allVideos.length)}
            className="absolute left-1 md:left-2 top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setFeaturedIndex((current) => (current + 1) % allVideos.length)}
            className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 md:p-6 rounded-xl md:rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-green-500 text-white shadow-lg scale-105 transform'
                  : 'bg-white hover:bg-green-50 border-2 border-gray-100 hover:border-green-400 hover:shadow-md hover:scale-102 transform'
              }`}
            >
              <span className="text-3xl mb-3">{category.icon}</span>
              <span className="text-sm font-semibold tracking-wide uppercase">
                {category.label}
              </span>
            </button>
          ))}
        </div>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {materials[selectedCategory].map((material, index) => (
            <div
              key={index}
              className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border-2 border-gray-100 hover:border-green-400 transition-all duration-300 hover:shadow-xl group"
            >
              <div className="flex flex-col gap-6">
                <div 
                  className={`relative rounded-2xl overflow-hidden shadow group ${
                    material.type === 'video' 
                      ? 'cursor-pointer hover:shadow-md transition-shadow duration-300' 
                      : 'bg-gradient-to-br from-green-50 to-green-100'
                  }`}
                  onClick={() => material.type === 'video' && setSelectedVideo(material.videoUrl)}
                >
                  {material.type === 'video' ? (
                    <>
                      <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-300">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="bg-white bg-opacity-95 p-4 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300">
                            <FiPlay className="w-8 h-8 text-green-600" />
                          </div>
                        </div>
                      </div>
                      <img 
                        src={`https://img.youtube.com/vi/${getVideoId(material.videoUrl)}/maxresdefault.jpg`}
                        alt={`${material.title} thumbnail`}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                      />
                    </>
                  ) : (
                    <div className="aspect-[4/3] w-full bg-gradient-to-br from-green-50 to-green-100 p-6">
                      <div className="flex flex-col items-start">
                        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
                          <FiBookOpen className="w-12 h-12 text-green-600" />
                        </div>
                        <div className="w-full space-y-3">
                          <div className="w-[80%] h-2 bg-green-200 rounded-full"></div>
                          <div className="w-[60%] h-2 bg-green-200 rounded-full"></div>
                          <div className="w-[70%] h-2 bg-green-200 rounded-full opacity-60"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-3 text-left px-1">
                    <h3 className="font-bold text-gray-900 text-base md:text-lg mb-2">{material.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{material.description}</p>
                  </div>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
                    <span className="text-xs md:text-sm font-medium px-2 md:px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                      {material.type === 'pdf' ? `PDF • ${material.size}` : `Video • ${material.duration}`}
                    </span>
                    <button 
                      className="w-full md:w-auto px-3 md:px-4 py-2 rounded-lg bg-green-100 text-green-700 font-semibold flex items-center justify-center md:justify-start gap-2 hover:bg-green-200 transition-all duration-300 group shadow-sm text-sm"
                      onClick={() => {
                        if (material.type === 'video' && material.videoUrl) {
                          setSelectedVideo(material.videoUrl);
                        } else if (material.type === 'pdf') {
                          handleDownload(material);
                        }
                      }}
                    >
                      {material.type === 'pdf' ? (
                        <>
                          <FiDownload className="w-4 h-4" />
                          Download
                        </>
                      ) : (
                        <>
                          <FiPlay className="w-4 h-4" />
                          Watch
                        </>
                      )}
                      <FiChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Tips */}
        <div className="mt-8 md:mt-12 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl md:rounded-2xl p-4 md:p-8 border-2 border-green-100 shadow-lg">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
            <FiCheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
            Quick Tips for Better Waste Management
          </h3>
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-4 bg-white/80 p-5 rounded-xl shadow-sm border border-green-100/50">
              <div className="flex-shrink-0">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-700 text-lg">Segregate waste into biodegradable, non-biodegradable, and recyclable categories</p>
            </div>
            <div className="flex items-center gap-4 bg-white/80 p-5 rounded-xl shadow-sm border border-green-100/50">
              <div className="flex-shrink-0">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-700 text-lg">Clean and dry recyclable materials before disposal</p>
            </div>
            <div className="flex items-center gap-4 bg-white/80 p-5 rounded-xl shadow-sm border border-green-100/50">
              <div className="flex-shrink-0">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-700 text-lg">Use separate containers for different types of waste</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
