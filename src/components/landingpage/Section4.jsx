import React from 'react';
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

const Section4 = () => {
  return (
    <footer id="contact" style={{ backgroundColor: '#166534' }} className="text-white scroll-mt-24">
      <div className="max-w-[1240px] mx-auto px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20 md:gap-32">
          <div className="landing-fade">
            <h3 className="text-4xl font-bold mb-8 text-white">
              Let's Talk <br /> Clean & <br /> Green.
            </h3>
          </div>

          <div className="landing-fade landing-delay-100">
            <h4 className="font-semibold mb-6 text-2xl text-white">SIPOCOT OFFICE</h4>
            <div className="space-y-3 text-white text-lg">
              <p>
                <a href="mailto:menro.sipocot@gmail.com" className="hover:underline text-white">
                  menro.sipocot@gmail.com
                </a>
              </p>
              <p>(054) 472-xxxx</p>
              <p>Sipocot Municipal Hall, Zone 1, Sipocot, Camarines Sur</p>
            </div>
          </div>

          <div className="landing-fade landing-delay-200">
            <h4 className="font-semibold mb-6 text-2xl text-white">FOLLOW OUR ADVOCACY</h4>
            <p className="mb-8 text-white/90 text-lg">
              Stay informed with tips, IEC materials, and environmental campaigns:
            </p>
            <div className="flex space-x-6 text-3xl">
              <a href="#" aria-label="Facebook" className="text-white hover:text-gray-200 transition-colors duration-200">
                <FaFacebook />
              </a>
              <a href="#" aria-label="Instagram" className="text-white hover:text-gray-200 transition-colors duration-200">
                <FaInstagram />
              </a>
              <a href="#" aria-label="Twitter" className="text-white hover:text-gray-200 transition-colors duration-200">
                <FaTwitter />
              </a>
            </div>
          </div>
        </div>
        <hr className="my-14 border-white/30" />

        <p className="text-center text-lg text-white/80">
          © 2025 Municipality of Sipocot – MENRO. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Section4;
