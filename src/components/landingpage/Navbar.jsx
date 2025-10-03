import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const handlePreLogin = () => {
    try {
      localStorage.removeItem('user');
    } catch {}
    setOpen(false);
  };

  return (
    <nav className="fixed w-full z-50 bg-green-700">
      <div className="max-w-[1240px] mx-auto px-8 py-5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-white rounded-full mr-1"></span>
          <span className="inline-block w-2 h-6 bg-green-400 rounded-sm mr-2"></span>
          <Link to="/" className="text-xl font-bold text-white hover:text-gray-200 transition-colors duration-200">
            KolekTrash
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <div className="flex space-x-8">
            <a href="#home" className="text-white hover:text-gray-200 transition-colors duration-200">Home</a>
            <a href="#services" className="text-white hover:text-gray-200 transition-colors duration-200">Services</a>
            <a href="#iec" className="text-white hover:text-gray-200 transition-colors duration-200">IEC Materials</a>
            <a href="#contact" className="text-white hover:text-gray-200 transition-colors duration-200">Contact</a>
          </div>
          <Link 
            to="/login"
            onClick={handlePreLogin}
            className="ml-8 px-6 py-2 bg-white hover:bg-gray-100 text-green-700 font-medium rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Login to your account"
          >
            Login
          </Link>
        </div>

        <div className="md:hidden">
          <button
            onClick={() => setOpen(!open)}
            className="focus:outline-none text-white bg-green-700"
            aria-label="Toggle menu"
          >
            {open ? (
              <FaTimes className="w-6 h-6" />
            ) : (
              <FaBars className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 px-8 py-4 space-y-4 bg-white shadow-lg">
          <a href="#home" className="block text-green-700 hover:text-green-600 transition-colors duration-200">Home</a>
          <a href="#services" className="block text-green-700 hover:text-green-600 transition-colors duration-200">Services</a>
          <a href="#iec" className="block text-green-700 hover:text-green-600 transition-colors duration-200">IEC Materials</a>
          <a href="#contact" className="block text-green-700 hover:text-green-600 transition-colors duration-200">Contact</a>
          <Link 
            to="/login"
            onClick={handlePreLogin}
            className="w-full bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors duration-200 block text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Login to your account"
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
