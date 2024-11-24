import { Button } from "@/components/ui/button";
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function LandingPage() {
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const descriptionRef = useRef(null);
  const buttonRef = useRef(null);
  const footerRef = useRef(null);
  const backgroundRef = useRef(null);

  useEffect(() => {
    // Background curve animation
    const paths = backgroundRef.current.querySelectorAll('path');

    gsap.set(paths, {
      strokeDasharray: 1000,
      strokeDashoffset: 1000
    });

    const tl = gsap.timeline({ repeat: -1, yoyo: true });

    paths.forEach((path, index) => {
      tl.to(path, {
        strokeDashoffset: 0,
        duration: 3,
        ease: "power1.inOut",
        delay: index * 0.2
      }, 0);
    });

    // Page entrance animations
    const pageTl = gsap.timeline();
    pageTl
      .fromTo(headerRef.current,
        { opacity: 0, y: -50 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      )
      .fromTo(titleRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" },
        "-=0.4"
      )
      .fromTo(subtitleRef.current,
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" },
        "-=0.3"
      )
      .fromTo(descriptionRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
        "-=0.4"
      )
      .fromTo(buttonRef.current,
        { opacity: 0, scale: 0.5 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: "elastic.out(1, 0.3)"
        },
        "-=0.3"
      );
  }, []);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("Login successful:", tokenResponse);
      try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        if (!userInfoResponse.ok) {
          throw new Error('Failed to fetch user info');
        }

        const userInfo = await userInfoResponse.json();
        localStorage.setItem('user', JSON.stringify({
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture
        }));
        const userData = {
          name: userInfo.name,
          email: userInfo.email,
        };

        const db = await fetch('https://nutritionai.in/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
        if (!db.ok) {
          console.log("Error saving user info to db");
        }
        console.log(db);
        navigate('/dashboard');
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Animated Background SVG */}
      <svg
        ref={backgroundRef}
        className="absolute inset-0 w-full h-full z-0 opacity-20"
        preserveAspectRatio="none"
      >
        <path
          d="M-100,300 Q200,150 500,300 T1100,300"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M-100,400 Q300,250 600,400 T1100,400"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
        />
        <path
          d="M-100,500 Q250,350 550,500 T1100,500"
          fill="none"
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      <header ref={headerRef} className="p-6 relative z-10">
        <h1 className="text-2xl font-bold">FluentAI</h1>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center space-y-12 relative z-10">
        <div className="text-center space-y-8 max-w-3xl">
          <h1
            ref={titleRef}
            className="text-5xl font-bold tracking-tight lg:text-6xl"
          >
            FluentAI
          </h1>
          <p
            ref={subtitleRef}
            className="text-xl text-white font-thin"
          >
            Master English. Speak with Confidence. Learn with FluentAI.
          </p>
          <p
            ref={descriptionRef}
            className="text-white text-md font-thin"
          >
            FluentAI is an innovative AI-powered application designed to help users enhance their English language skills.
            Whether you&apos;re looking to improve your reading, writing, or speaking abilities,
            FluentAI offers personalized lessons, real-time feedback, and engaging exercises
            tailored to your proficiency level.
          </p>
        </div>
        <div ref={buttonRef}>
          <Button
            className="bg-white text-black hover:bg-gray-200 h-12 text-md font-regular transition-colors duration-200 mx-10"
            onClick={() => login()}
          >
            Get Started
          </Button>
          <div className="flex justify-center items-center mt-10">
            <p className="text-sm text-white font-thin">
              Made with  <a href="https://www.assemblyai.com/" className="text-blue-500">AssemblyAI</a>
            </p>
          </div>
        </div>
      </main>

      <footer ref={footerRef} className="w-full p-6 text-center text-white relative z-10">
        <p>© 2024 FluentAI. All rights reserved.</p>
      </footer>
    </div>
  );
}