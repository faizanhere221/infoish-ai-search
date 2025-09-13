'use client'

import React from 'react';
import { Linkedin, Twitter, Github, Mail } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  image: string;
  
}

const TeamSection: React.FC = () => {
  // Edit these team members directly in the code
  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Faizan Islam',
      role: 'Founder & CEO',
      description: 'Passionate Entrepreneur & Computer Science student at Bahauddin Zakariya University. Leading the product strategic direction and development.',
      image: '/images/team/founder.jpg',
      
    },
    {
      id: '2',
      name: 'Farhan Islam',
      role: 'Co-Founder',
      description: 'AI/ML expert specializing in recommendation systems and data analysis. Building scalable solutions for influencer discovery. ',
      image: '/images/team/cto.jpg',
      
    },
    {
      id: '3',
      name: 'Israr Ahmad',
      role: 'Digital Marketing Expert',
      description: 'Experienced in SEO, SEM, social media marketing, and influencer relations. Skilled in campaign optimization, audience analysis, and building impactful brand–creator partnerships to drive measurable growth.',
      image: '/images/team/marketing.jpg',
      
    }
  ];

  return (
    <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-12 text-white mb-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Meet the Team</h2>
        <p className="text-xl text-green-100">
          We're a passionate team of Pakistani entrepreneurs, developers, and marketers
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {teamMembers.map((member) => (
          <div key={member.id} className="text-center">
            {/* Profile Image */}
            <div className="w-32 h-32 mx-auto mb-6">
              <div className="w-full h-full rounded-full overflow-hidden bg-white shadow-lg">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to emoji if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-full flex items-center justify-center text-green-600">
                  <span className="text-4xl">
                    {member.role.includes('CEO') ? '👨‍💻' : 
                     member.role.includes('CTO') ? '👨‍💻' : '👨‍💼'}
                  </span>
                </div>
              </div>
            </div>

            {/* Member Info */}
            <div>
              <h3 className="text-2xl font-bold mb-2">{member.name}</h3>
              <h4 className="text-lg font-semibold text-green-100 mb-4">{member.role}</h4>
              <p className="text-green-100 leading-relaxed text-sm mb-6">
                {member.description}
              </p>

              
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamSection;