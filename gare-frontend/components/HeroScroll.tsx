"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowLeftRight } from "lucide-react"

export default function HeroScroll() {
  const router = useRouter()
  const [depart, setDepart] = useState("")
  const [arrivee, setArrivee] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  const handleSwap = () => {
    setDepart(arrivee)
    setArrivee(depart)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (depart) params.set("villeDepart", depart)
    if (arrivee) params.set("villeArrivee", arrivee)
    if (date) params.set("date", date)
    router.push(`/fr/recherche?${params.toString()}`)
  }

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      <video
        src="/hero/video.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-3">
            GareConnect 4.0
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto">
            La révolution du transport routier commence ici.
          </p>
        </div>

        <form onSubmit={handleSearch} className="w-full max-w-3xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="h-1 bg-orange-500" />
            <div className="p-4 md:p-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_1fr] gap-2.5 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Départ
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ville de départ"
                    value={depart}
                    onChange={(e) => setDepart(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition font-medium text-sm"
                  />
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleSwap}
                    className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition shadow-md hover:shadow-lg active:scale-95 shrink-0"
                    title="Échanger départ et arrivée"
                  >
                    <ArrowLeftRight size={14} />
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Arrivée
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ville d'arrivée"
                    value={arrivee}
                    onChange={(e) => setArrivee(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition font-medium text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition font-medium text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-5 py-2.5 transition hover:-translate-y-0.5 shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 text-sm"
              >
                <Search size={16} />
                Rechercher des trajets
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}
