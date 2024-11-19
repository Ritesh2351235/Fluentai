import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Pen, Mic, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const headerRef = useRef(null);
  const cardsRef = useRef([]);
  const logoutRef = useRef(null);

  const sections = [
    { title: 'Reading', description: 'Improve your comprehension skills', icon: BookOpen, path: '/reading', onClick: () => navigate('/reading') },
    { title: 'Writing', description: 'Enhance your written expression', icon: Pen, path: '/writing', onClick: () => navigate('/writing') },
    { title: 'Speaking', description: 'Perfect your pronunciation and fluency', icon: Mic, path: '/speaking', onClick: () => navigate('/speaking') },
  ];

  const handleLogout = () => {
    // Clear user data from local storage
    localStorage.removeItem('user');

    // Navigate back to landing page
    navigate('/');
  };

  useEffect(() => {
    // Create GSAP timeline for animations
    const tl = gsap.timeline();

    // Animate header
    tl.fromTo(headerRef.current,
      { opacity: 0, y: -50 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    );

    // Animate cards with stagger
    cardsRef.current.forEach((card, index) => {
      tl.fromTo(card,
        { opacity: 0, scale: 0.8, y: 50 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.6,
          ease: "back.out(1.7)"
        },
        `-=${index * 0.2}`
      );
    });

    // Animate logout button
    tl.fromTo(logoutRef.current,
      { opacity: 0, x: 50 },
      { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }
    );

    // Optional hover effects for cards
    cardsRef.current.forEach(card => {
      gsap.set(card, { transformOrigin: 'center' });

      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          scale: 1.05,
          duration: 0.3,
          ease: "power1.inOut"
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          scale: 1,
          duration: 0.3,
          ease: "power1.inOut"
        });
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 w-screen">
      <div
        ref={logoutRef}
        className="absolute top-4 right-4 flex items-center space-x-4"
      >
        <h2 className="text-md font-thin">
          {user ? `Hi, ${user.name}` : 'Hi, Guest'}
        </h2>
        <Button
          variant="outline"
          className="text-black border-white hover:bg-white"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>

      <div ref={headerRef} className="mb-8 text-center">
        <h1
          className="text-4xl font-bold mb-2"
          style={{ fontFamily: 'Guestfont, sans-serif' }}
        >
          FluentAI Dashboard
        </h1>
        <p className="text-lg text-white max-w-md">Choose your learning path</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        {sections.map((section, index) => (
          <Card
            key={index}
            ref={el => cardsRef.current[index] = el}
            className="bg-black border-white border hover:bg-opacity-20 transition-colors"
          >
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <section.icon className="mr-2" />
                {section.title}
              </CardTitle>
              <CardDescription className="text-white font-thin">
                {section.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-white text-black hover:bg-gray-200"
                onClick={() => section.onClick()}
              >
                Start {section.title}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}