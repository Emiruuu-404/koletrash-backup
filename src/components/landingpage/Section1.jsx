import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const images = [
  'https://www.xinsurance.com/wp-content/uploads/sites/5/2018/04/GettyImages-495351035.jpg',
  'https://www.firstdiscoverers.co.uk/wp-content/uploads/2019/08/recycling.jpg',
  'https://www.nistglobal.com/blog/wp-content/uploads/2023/05/Benefits-of-Implementing-an-Environmental-Management-System%E2%80%AF-05-05.jpg',
  '',
  '',
  '',
  // Add more image URLs as you like
];

const Section1 = () => {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrev(current);
      setFade(false);
      setTimeout(() => {
        setCurrent((prevIdx) => (prevIdx + 1) % images.length);
        setFade(true);
      }, 800); 
    }, 5000);
    return () => clearInterval(interval);
  }, [current]);

  return (
  <div id="home" className="relative h-screen overflow-hidden scroll-mt-24">
      {prev !== null && prev !== current && !fade && (
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 opacity-100 z-10`}
          style={{ backgroundImage: `url('${images[prev]}')` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
      )}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${fade ? 'opacity-100 z-20' : 'opacity-0 z-0'}`}
        style={{ backgroundImage: `url('${images[current]}')` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>
      <div className="relative z-30 flex flex-col items-center justify-center h-full text-center text-white px-4 space-y-4">
        <h1 className="text-3xl md:text-5xl font-bold landing-fade">
          Let's Keep Sipocot Clean, Green, and Waste-Free
        </h1>
        <p className="text-lg md:text-xl landing-fade landing-delay-100">Join the change today.</p>
        <Link
          to="/login"
          className="bg-white text-green-700 px-6 py-2 rounded hover:bg-gray-200 transition-colors duration-200 landing-fade landing-delay-200"
        >
          Get Started
        </Link>
      </div>
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-40">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setPrev(current);
              setFade(false);
              setTimeout(() => {
                setCurrent(idx);
                setFade(true);
              }, 800);
            }}
            className={`w-3 h-3 rounded-full transition-all duration-300 border-2 border-white ${
              current === idx 
                ? 'bg-green-400 scale-110 border-green-400' 
                : 'bg-transparent hover:bg-white hover:bg-opacity-25'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Section1;
