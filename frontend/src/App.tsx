import { Routes, Route } from 'react-router-dom'
import { useTelemetry } from './hooks/useTelemetry'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { StoryOverlayController } from './components/StoryOverlay'
import { OverviewPage } from './pages/OverviewPage'
import { PlantTwinPage } from './pages/PlantTwinPage'
import { RevenuePage } from './pages/RevenuePage'
import { SustainabilityPage } from './pages/SustainabilityPage'
import { HazardsPage } from './pages/HazardsPage'
import { SimulationPage } from './pages/SimulationPage'
import { OptimizationPage } from './pages/OptimizationPage'
import { StoryModePage } from './pages/StoryModePage'
import { CalculatorPage } from './pages/CalculatorPage'
import { ReportPage } from './pages/ReportPage'
import { ShiftComparisonPage } from './pages/ShiftComparisonPage'

function App() {
  useTelemetry()

  return (
    <div className="h-screen w-screen flex bg-bg-primary overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/plant" element={<PlantTwinPage />} />
            <Route path="/simulation" element={<SimulationPage />} />
            <Route path="/optimization" element={<OptimizationPage />} />
            <Route path="/revenue" element={<RevenuePage />} />
            <Route path="/hazards" element={<HazardsPage />} />
            <Route path="/sustainability" element={<SustainabilityPage />} />
            <Route path="/story" element={<StoryModePage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/shifts" element={<ShiftComparisonPage />} />
          </Routes>
        </main>
      </div>
      {/* Story mode overlay — persists across page navigations */}
      <StoryOverlayController />
    </div>
  )
}

export default App
