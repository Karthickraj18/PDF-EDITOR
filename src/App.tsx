import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import MergePDF from './pages/MergePDF';
import SplitPDF from './pages/SplitPDF';
import WordToPDF from './pages/WordToPDF';
import RotatePDF from './pages/RotatePDF';
import JPGToPDF from './pages/JPGToPDF';
import PDFToJPG from './pages/PDFToJPG';
import ProtectPDF from './pages/ProtectPDF';
import WatermarkPDF from './pages/WatermarkPDF';
import SignPDF from './pages/SignPDF';
import CompressPDF from './pages/CompressPDF';
import ToolPlaceholder from './pages/ToolPlaceholder';
import DeletePages from './pages/DeletePages';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col relative w-full font-body text-text-main">
        {/* subtle background glow effects */}
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 blur-[150px] rounded-full pointer-events-none z-0"></div>

        <Navbar />
        <main className="flex-1 pt-20 flex flex-col relative z-10 w-full items-center">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/merge" element={<MergePDF />} />
            <Route path="/split" element={<SplitPDF />} />
            <Route path="/pdf-to-word" element={<WordToPDF />} />
            <Route path="/rotate" element={<RotatePDF />} />
            <Route path="/jpg-to-pdf" element={<JPGToPDF />} />
            <Route path="/pdf-to-jpg" element={<PDFToJPG />} />
            <Route path="/protect" element={<ProtectPDF />} />
            <Route path="/watermark" element={<WatermarkPDF />} />
            <Route path="/sign" element={<SignPDF />} />
            <Route path="/compress" element={<CompressPDF />} />
            <Route path="/delete-pages" element={<DeletePages />} />
            <Route path="/tool-placeholder" element={<ToolPlaceholder />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
