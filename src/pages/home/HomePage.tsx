import { ArtProject } from '@/sections/ArtProject'
import { Categories } from '@/sections/Categories'
import { Editorial } from '@/sections/Editorial'
import { FeaturedPieces } from '@/sections/FeaturedPieces'
import { FeatureHero } from '@/sections/FeatureHero'
import { Footer } from '@/sections/Footer'
import { Header } from '@/sections/Header'
import { Menu } from '@/sections/Menu'
import { NewArrivals } from '@/sections/NewArrivals'
import { VideoFeatures } from '@/sections/VideoFeatures'

/** Home na ordem e no papel das seções da Sigma (seção 6 do PROMPT). */
export function HomePage() {
  return (
    <div id="topo">
      <Header />
      <Menu />
      <main id="conteudo" tabIndex={-1} className="outline-none">
        <FeatureHero />
        <NewArrivals />
        <FeaturedPieces />
        <Editorial />
        <ArtProject />
        <VideoFeatures />
        <Categories />
      </main>
      <Footer />
    </div>
  )
}
