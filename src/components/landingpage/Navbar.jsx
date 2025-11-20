import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import logo from "../../assets/logo/logo.png";

const LOGIN_LOADING_DURATION_MS = 2000;

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const navigate = useNavigate();

  const handlePreLogin = () => {
    try {
      localStorage.removeItem('user');
    } catch {}
    setOpen(false);
  };

  const handleLoginClick = () => {
    if (loadingLogin) return;
    handlePreLogin();
    setLoadingLogin(true);
    setTimeout(() => navigate('/login'), LOGIN_LOADING_DURATION_MS);
  };

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setOpen(false);
    const element = document.querySelector(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="fixed w-full z-50 bg-green-700">
      <div className="max-w-[1240px] mx-auto px-8 py-5 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-0.5 group" aria-label="KolekTrash home">
          <img
            src={logo}
            alt="KolekTrash logo"
            className="h-10 w-auto drop-shadow-md transition-transform duration-200 group-hover:scale-105"
          />
          <span className="hidden md:inline text-2xl md:text-2xl font-bold text-white group-hover:text-gray-200 transition-colors duration-200">
            KolekTrash
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          <div className="flex space-x-8">
            <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="text-white hover:text-gray-200 transition-colors duration-200">Home</a>
            <a href="#services" onClick={(e) => handleNavClick(e, '#services')} className="text-white hover:text-gray-200 transition-colors duration-200">Services</a>
            <a href="#about" onClick={(e) => handleNavClick(e, '#about')} className="text-white hover:text-gray-200 transition-colors duration-200">About Us</a>
            <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')} className="text-white hover:text-gray-200 transition-colors duration-200">Contact</a>
          </div>
          <button 
            type="button"
            onClick={handleLoginClick}
            disabled={loadingLogin}
            className="ml-8 px-6 py-2 bg-white hover:bg-gray-100 text-green-700 font-medium rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-80 disabled:cursor-wait"
            aria-label="Login to your account"
          >
            {loadingLogin ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-green-200 border-t-green-600 animate-spin"></span>
                <span>Redirecting...</span>
              </span>
            ) : (
              <span>Login</span>
            )}
          </button>
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
        <div className="md:hidden absolute top-full left-0 right-0 px-8 py-4 space-y-4 backdrop-blur-md bg-white/80 shadow-lg">
          <a href="#home" onClick={(e) => handleNavClick(e, '#home')} className="block text-green-700 hover:text-green-600 transition-colors duration-200">Home</a>
          <a href="#services" onClick={(e) => handleNavClick(e, '#services')} className="block text-green-700 hover:text-green-600 transition-colors duration-200">Services</a>
          <a href="#about" onClick={(e) => handleNavClick(e, '#about')} className="block text-green-700 hover:text-green-600 transition-colors duration-200">About Us</a>
          <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')} className="block text-green-700 hover:text-green-600 transition-colors duration-200">Contact</a>
          <button 
            type="button"
            onClick={handleLoginClick}
            disabled={loadingLogin}
            className="w-full bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors duration-200 block text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-80 disabled:cursor-wait"
            aria-label="Login to your account"
          >
            {loadingLogin ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin"></span>
                <span>Redirecting...</span>
              </span>
            ) : (
              <span>Login</span>
            )}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
