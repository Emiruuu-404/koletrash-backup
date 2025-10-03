import React from 'react'
import { FaRecycle, FaTruck, FaChartLine } from "react-icons/fa";

const Section2 = () => {
  return (
    <section id="services" className="bg-white py-20 scroll-mt-24">
      <div className="max-w-[1240px] mx-auto px-8">
        <h2 className="text-3xl font-bold mb-16 text-center landing-fade" style={{ color: '#218a4c' }}>Why KolekTrash?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 landing-fade">
            <FaRecycle className="mb-6 mx-auto" style={{ color: '#218a4c', fontSize: '2.5rem' }} />
            <h3 className="font-semibold text-xl mb-3 text-center" style={{ color: '#222222' }}>Eco-Friendly</h3>
            <p className="text-center" style={{ color: '#222222' }}>Promote sustainability with our eco-conscious practices.</p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 landing-fade landing-delay-100">
            <FaTruck className="mb-6 mx-auto" style={{ color: '#218a4c', fontSize: '2.5rem' }} />
            <h3 className="font-semibold text-xl mb-3 text-center" style={{ color: '#222222' }}>Efficient Collection</h3>
            <p className="text-center" style={{ color: '#222222' }}>Streamlined services tailored to your needs.</p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 landing-fade landing-delay-200">
            <FaChartLine className="mb-6 mx-auto" style={{ color: '#218a4c', fontSize: '2.5rem' }} />
            <h3 className="font-semibold text-xl mb-3 text-center" style={{ color: '#222222' }}>Smart Analytics</h3>
            <p className="text-center" style={{ color: '#222222' }}>Gain insights to optimize resource usage.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Section2
