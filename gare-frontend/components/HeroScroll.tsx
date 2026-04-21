"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import styles from "./HeroScroll.module.css"
import { ChevronRight } from "lucide-react"

export default function HeroScroll() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  
  // Element Refs for raw DOM manipulation
  const videoLayerRef = useRef<HTMLDivElement>(null)
  const img1LayerRef = useRef<HTMLDivElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const formLayerRef = useRef<HTMLDivElement>(null)
  const scrollHintRef = useRef<HTMLDivElement>(null)
  
  // Dot refs for progression
  const dot1Ref = useRef<HTMLDivElement>(null)
  const dot2Ref = useRef<HTMLDivElement>(null)
  const dot3Ref = useRef<HTMLDivElement>(null)
  const dot4Ref = useRef<HTMLDivElement>(null)

  // Form State
  const [depart, setDepart] = useState("")
  const [arrivee, setArrivee] = useState("")
  const [date, setDate] = useState("")
  const [passagers, setPassagers] = useState(1)

  useEffect(() => {
    const handleScroll = () => {
      if (!wrapperRef.current) return
      
      const rect = wrapperRef.current.getBoundingClientRect()
      
      const scrollableDistance = rect.height - window.innerHeight
      let progress = -rect.top / scrollableDistance
      
      // Clamp progress between 0 and 1
      progress = Math.max(0, Math.min(1, progress))

      // Is mobile? Adapt max scale
      const isMobile = window.innerWidth <= 768
      const maxScale = isMobile ? 3 : 5

      // Hint opacity
      if (scrollHintRef.current) {
        scrollHintRef.current.style.opacity = progress > 0.05 ? "0" : "1"
      }

      // PHASE 1: 0% to 25% (Video Zoom in & Text Fade out)
      if (progress <= 0.25) {
        const p1 = progress / 0.25
        
        if (textLayerRef.current) textLayerRef.current.style.opacity = `${1 - p1 * 2}`
        if (videoLayerRef.current) {
          videoLayerRef.current.style.transform = `scale(${1 + p1})`
          videoLayerRef.current.style.transformOrigin = "50% 55%"
          videoLayerRef.current.style.opacity = "1"
        }
        if (img1LayerRef.current) img1LayerRef.current.style.opacity = "0"
        if (formLayerRef.current) {
            formLayerRef.current.style.opacity = "0";
            formLayerRef.current.style.pointerEvents = "none";
        }
        
        updateDots(0)
      }

      // PHASE 2: 25% to 50% (Crossfade Video -> Bus Seat)
      else if (progress > 0.25 && progress <= 0.5) {
        const p2 = (progress - 0.25) / 0.25

        if (videoLayerRef.current) videoLayerRef.current.style.opacity = `${1 - p2}`
        if (img1LayerRef.current) {
          img1LayerRef.current.style.opacity = "1"
          img1LayerRef.current.style.transform = `scale(1)`
          // Ensure it's not blurred yet
          img1LayerRef.current.style.filter = `blur(0px) brightness(1)`
        }
        if (formLayerRef.current) {
            formLayerRef.current.style.opacity = "0";
            formLayerRef.current.style.pointerEvents = "none";
        }
        
        updateDots(1)
      }

      // PHASE 3: 50% to 75% (Massive Zoom into Bus Seat Tablet)
      else if (progress > 0.5 && progress <= 0.75) {
        const p3 = (progress - 0.5) / 0.25

        if (img1LayerRef.current) {
          img1LayerRef.current.style.opacity = "1"
          img1LayerRef.current.style.transform = `scale(${1 + (p3 * (maxScale - 1))})`
          img1LayerRef.current.style.transformOrigin = "50% 50%" // Central zoom on the tablet
          img1LayerRef.current.style.filter = `blur(0px) brightness(1)`
        }
        if (formLayerRef.current) {
            formLayerRef.current.style.opacity = "0";
            formLayerRef.current.style.pointerEvents = "none";
        }
        
        updateDots(2)
      }

      // PHASE 4: 75% to 100% (Blur Background, Display Static Tablet Frame)
      else if (progress > 0.75) {
        const p4 = (progress - 0.75) / 0.25

        if (img1LayerRef.current) {
           // We cap the scale so it stays zoomed in, but we blur it heavily
           img1LayerRef.current.style.transform = `scale(${maxScale})`
           img1LayerRef.current.style.filter = `blur(${p4 * 16}px) brightness(${1 - (p4 * 0.5)})`
        }
        if (formLayerRef.current) {
           formLayerRef.current.style.opacity = `${p4}`
           formLayerRef.current.style.pointerEvents = p4 > 0.8 ? "auto" : "none"
        }
        
        updateDots(3)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Helper to rapidly update dot styles
  const updateDots = (activeIndex: number) => {
    const dots = [dot1Ref, dot2Ref, dot3Ref, dot4Ref]
    dots.forEach((dot, index) => {
      if (dot.current) {
        if (index === activeIndex) {
          dot.current.style.transform = "scale(1.4)"
          dot.current.style.backgroundColor = "#f97316" // ORANGE 
        } else {
          dot.current.style.transform = "scale(1)"
          dot.current.style.backgroundColor = "rgba(255, 255, 255, 0.3)"
        }
      }
    })
  }

  const handleChipClick = (dep: string, arr: string) => {
    setDepart(dep)
    setArrivee(arr)
  }

  return (
    <section ref={wrapperRef} id="hero-wrapper" className={styles.wrapper}>
      <div className={styles.sticky} style={{ backgroundColor: '#000' }}>
        
        {/* Layer 1: Video */}
        <div ref={videoLayerRef} className={styles.layerVideo}>
          <video 
            src="/hero/video.mp4"
            autoPlay 
            muted 
            loop 
            playsInline 
            preload="auto"
          />
        </div>

        {/* Layer 2: Image Bus Seat POV */}
        <div ref={img1LayerRef} className={styles.layerImg1}>
          <Image 
            src="/hero/bus_seat.png"
            alt="Interior bus"
            fill
            sizes="100vw"
            priority={true}
            style={{ objectFit: 'cover' }}
          />
        </div>

        {/* Text Fade (Phase 1) */}
        <div ref={textLayerRef} className={styles.heroText}>
          <h1 className={styles.heroTitle}>GareConnect 4.0</h1>
          <p className={styles.heroSubtitle}>La révolution du transport routier commence ici.</p>
        </div>

        {/* 
            Layer 3: THE ACETERNITY TABLET (Static / No 3D Tilt) 
            Appears at Phase 4 
        */}
        <div ref={formLayerRef} className="absolute inset-0 z-40 flex items-center justify-center p-4" style={{ opacity: 0, pointerEvents: 'none', transition: 'opacity 0.1s linear' }}>
            
            {/* Real Aceternity Tablet Frame */}
            <div className="max-w-5xl mx-auto h-[35rem] md:h-[45rem] w-full border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-[30px] shadow-2xl">
                {/* Screen Content Wrapper */}
                <div className="h-full w-full overflow-hidden rounded-2xl bg-white md:rounded-2xl relative flex flex-col justify-center items-center p-6 md:p-12">
                     
                     <div className="absolute top-0 left-0 w-full h-2 bg-orange-500" />
                            
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 text-center">Où voulez-vous aller ?</h2>
                    
                    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="flex flex-col gap-1.5 md:col-span-1">
                            <label className="text-[11px] uppercase text-slate-500 font-bold tracking-wider">Départ</label>
                            <input 
                                type="text" 
                                placeholder="Ville de départ"
                                value={depart}
                                onChange={(e) => setDepart(e.target.value)}
                                className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-1">
                            <label className="text-[11px] uppercase text-slate-500 font-bold tracking-wider">Arrivée</label>
                            <input 
                                type="text" 
                                placeholder="Ville d'arrivée"
                                value={arrivee}
                                onChange={(e) => setArrivee(e.target.value)}
                                className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-1">
                            <label className="text-[11px] uppercase text-slate-500 font-bold tracking-wider">Date</label>
                            <input 
                                type="date" 
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-1">
                            <label className="text-[11px] uppercase text-slate-500 font-bold tracking-wider">Passagers</label>
                            <input 
                                type="number" 
                                min="1"
                                max="50"
                                value={passagers}
                                onChange={(e) => setPassagers(parseInt(e.target.value))}
                                className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                            />
                        </div>
                        <button className="md:col-span-1 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-6 py-3 h-[46px] transition-all hover:-translate-y-1 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2">
                            Rechercher <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-2 justify-center">
                        <button onClick={() => handleChipClick('Casa', 'Marrakech')} className="text-xs font-semibold bg-slate-100 text-slate-600 px-4 py-2 rounded-full hover:bg-orange-100 hover:text-orange-600 transition-colors">
                            Casa → Marrakech
                        </button>
                        <button onClick={() => handleChipClick('Rabat', 'Fès')} className="text-xs font-semibold bg-slate-100 text-slate-600 px-4 py-2 rounded-full hover:bg-orange-100 hover:text-orange-600 transition-colors">
                            Rabat → Fès
                        </button>
                        <button onClick={() => handleChipClick('Tanger', 'Casa')} className="text-xs font-semibold bg-slate-100 text-slate-600 px-4 py-2 rounded-full hover:bg-orange-100 hover:text-orange-600 transition-colors">
                            Tanger → Casa
                        </button>
                        <button onClick={() => handleChipClick('Agadir', 'Marrakech')} className="text-xs font-semibold bg-slate-100 text-slate-600 px-4 py-2 rounded-full hover:bg-orange-100 hover:text-orange-600 transition-colors">
                            Agadir → Marrakech
                        </button>
                    </div>

                </div>
            </div>

        </div>

        {/* Progression Dots */}
        <div className={styles.stageDots}>
          <div ref={dot1Ref} className={styles.dot}></div>
          <div ref={dot2Ref} className={styles.dot}></div>
          <div ref={dot3Ref} className={styles.dot}></div>
          <div ref={dot4Ref} className={styles.dot}></div>
        </div>

        {/* Scroll Hint */}
        <div ref={scrollHintRef} className={styles.scrollHint}>
          <span className={styles.scrollText}>SCROLL</span>
          <div className={styles.scrollLine}></div>
        </div>

      </div>
    </section>
  )
}
