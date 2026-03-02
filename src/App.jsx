import { useState, useRef } from 'react'
import { toPng } from 'html-to-image'
import './App.css'
import template1 from '../Banner Template/1.png'
import template2 from '../Banner Template/2.png'
import template3 from '../Banner Template/3.png'
import template4 from '../Banner Template/4.png'
import template5 from '../Banner Template/5.png'

const templates = [
  { id: 1, src: template1 },
  { id: 2, src: template2 },
  { id: 3, src: template3 },
  { id: 4, src: template4 },
  { id: 5, src: template5 },
]

function removeBackgroundSimple(imageSrc, callback) {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    const topLeftColor = { r: data[0], g: data[1], b: data[2] }
    
    const threshold = 30
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      const diff = Math.abs(r - topLeftColor.r) + 
                   Math.abs(g - topLeftColor.g) + 
                   Math.abs(b - topLeftColor.b)
      
      if (diff < threshold) {
        data[i + 3] = 0
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
    canvas.toBlob((blob) => {
      callback(URL.createObjectURL(blob))
    }, 'image/png')
  }
  img.src = imageSrc
}

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [logo, setLogo] = useState(null)
  const [processedLogo, setProcessedLogo] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [logoPosition, setLogoPosition] = useState({ x: 85, y: 50 })
  const [logoSize, setLogoSize] = useState(250)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [bgColor, setBgColor] = useState('white')
  const [threshold, setThreshold] = useState(30)
  const bannerRef = useRef(null)
  const logoRef = useRef(null)

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (file && selectedTemplate) {
      setIsProcessing(true)
      const reader = new FileReader()
      reader.onload = (event) => {
        const originalLogo = event.target.result
        setLogo(originalLogo)
        
        removeBackgroundSimple(originalLogo, (url) => {
          setProcessedLogo(url)
          setIsProcessing(false)
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const reprocessLogo = () => {
    if (logo) {
      setIsProcessing(true)
      removeBackgroundSimple(logo, (url) => {
        setProcessedLogo(url)
        setIsProcessing(false)
      })
    }
  }

  const handleMouseDown = (e, type) => {
    e.stopPropagation()
    if (type === 'resize') {
      setIsResizing(true)
    } else {
      setIsDragging(true)
    }
  }

  const handleMouseMove = (e) => {
    if (!bannerRef.current) return
    
    const bannerRect = bannerRef.current.getBoundingClientRect()
    
    if (isDragging) {
      const x = ((e.clientX - bannerRect.left) / bannerRect.width) * 100
      const y = ((e.clientY - bannerRect.top) / bannerRect.height) * 100
      setLogoPosition({ 
        x: Math.max(5, Math.min(95, x)), 
        y: Math.max(5, Math.min(95, y)) 
      })
    }
    
    if (isResizing) {
      const newSize = Math.max(50, Math.min(500, e.clientX - bannerRect.left - (logoPosition.x / 100 * bannerRect.width) + (bannerRect.width / 2)))
      setLogoSize(newSize)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
  }

  const handleDownload = async () => {
    if (bannerRef.current) {
      setIsDownloading(true)
      setTimeout(async () => {
        const dataUrl = await toPng(bannerRef.current, { 
          quality: 1,
          pixelRatio: 2
        })
        const link = document.createElement('a')
        link.download = `banner-template-${selectedTemplate}.png`
        link.href = dataUrl
        link.click()
        setIsDownloading(false)
      }, 100)
    }
  }

  const resetAll = () => {
    setSelectedTemplate(null)
    setLogo(null)
    setProcessedLogo(null)
    setLogoPosition({ x: 85, y: 50 })
    setLogoSize(250)
  }

  return (
    <div 
      className="container"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="header">
        <h1>BD Team Form Banner Creator</h1>
        <p>Select a template, upload your logo, and download the banner</p>
      </div>

      {!selectedTemplate ? (
        <div className="template-selection">
          <h2>Select a Template</h2>
          <div className="template-grid">
            {templates.map((template) => (
              <div 
                key={template.id}
                className="template-card"
                onClick={() => setSelectedTemplate(template.id)}
              >
                <img src={template.src} alt={`Template ${template.id}`} />
                <span>Template {template.id}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="editor-section">
          <button className="back-btn" onClick={resetAll}>
            ← Back to Templates
          </button>

          <div className="upload-section">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              id="logo-upload"
              className="logo-input"
            />
            <label htmlFor="logo-upload" className="upload-label">
              {isProcessing ? 'Processing...' : 'Upload Logo'}
            </label>

            {processedLogo && (
              <button onClick={handleDownload} className="download-btn">
                Download Banner
              </button>
            )}
          </div>

          {processedLogo && (
            <div className="controls">
              <label>
                Logo Size: 
                <input 
                  type="range" 
                  min="50" 
                  max="500" 
                  value={logoSize} 
                  onChange={(e) => setLogoSize(Number(e.target.value))}
                />
                {logoSize}px
              </label>
              <button className="reprocess-btn" onClick={reprocessLogo}>
                Retry Background Removal
              </button>
              <p className="hint">Drag logo to move • Use slider to resize</p>
            </div>
          )}

          <div className="banner-wrapper">
            <div className="banner-container" ref={bannerRef}>
              <div 
                className="banner"
                style={{
                  width: '1584px',
                  height: '396px',
                  position: 'relative',
                  backgroundImage: `url(${templates[selectedTemplate - 1].src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {processedLogo ? (
                  <div 
                    ref={logoRef}
                    className="logo-wrapper"
                    style={{
                      position: 'absolute',
                      left: `${logoPosition.x}%`,
                      top: `${logoPosition.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: `${logoSize}px`,
                      height: `${logoSize * 0.6}px`,
                      cursor: 'move',
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'drag')}
                  >
                    <img 
                      src={processedLogo} 
                      alt="Logo" 
                      className="logo-placed"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                      }}
                    />
                    <div 
                      className={`resize-handle ${isDownloading ? 'hidden' : ''}`}
                      onMouseDown={(e) => handleMouseDown(e, 'resize')}
                    >
                      ↔
                    </div>
                  </div>
                ) : (
                  <div 
                    className="logo-placeholder"
                    style={{
                      position: 'absolute',
                      right: '80px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '200px',
                      height: '100px',
                      border: '2px dashed #fff',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '14px',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                    }}
                  >
                    {isProcessing ? 'Removing background...' : 'Upload a logo'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="instructions">
            <p>Drag the logo to reposition • Use slider to resize</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
