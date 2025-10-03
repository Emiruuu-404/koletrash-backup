import React from 'react'
import { Link } from 'react-router-dom'

const Section3 = () => {
  return (
    <div
      id="iec"
      className="relative h-[500px] bg-cover bg-center flex items-center justify-center scroll-mt-24"
      style={{
        backgroundImage: `url('https://img.freepik.com/premium-photo/generative-ai-illustration-eco-light-bulb-surrounded-by-forest-clean-energy-environment_58460-20091.jpg')`, 
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="relative z-10 text-center text-white px-8 max-w-3xl mx-auto space-y-6">
        <h2 className="text-4xl md:text-5xl font-bold landing-fade">Make a Difference Today</h2>
        <p className="text-lg text-gray-100 landing-fade landing-delay-100">Join us in transforming waste management for a better tomorrow.</p>
        <Link
          to="/signup"
          className="inline-block bg-white text-gray-800 px-8 py-3 rounded-md hover:bg-gray-100 transition-colors duration-200 font-medium shadow-sm landing-fade landing-delay-200"
        >
          Sign Up Now
        </Link>
      </div>
    </div>
  )
}

export default Section3
