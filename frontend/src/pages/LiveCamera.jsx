import { useEffect, useRef, useState } from 'react';
import { Camera as CameraIcon, StopCircle, ShieldCheck } from 'lucide-react';

export default function LiveCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const intervalRef = useRef(null);
  const [lastRecognized, setLastRecognized] = useState(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      stopCameraInternal();
    };
  }, []);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support camera access.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
        intervalRef.current = setTimeout(processFrame, 1000); 
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Failed to access camera: " + err.message);
    }
  };

  const stopCameraInternal = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    // Clear HUD
    if (drawCanvasRef.current) {
      const ctx = drawCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    stopCameraInternal();
    setIsStreaming(false);
  };

  const processFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Check if we are still streaming (this prevents loops after stop)
    if (videoRef.current.srcObject === null) return;

    const video = videoRef.current;
    if (video.videoWidth === 0) {
      intervalRef.current = setTimeout(processFrame, 500);
      return;
    }

    try {
      const captureCanvas = canvasRef.current;
      const ctx = captureCanvas.getContext('2d');
      captureCanvas.width = video.videoWidth;
      captureCanvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
      
      const blob = await new Promise(resolve => captureCanvas.toBlob(resolve, 'image/jpeg', 0.8));
      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');
      formData.append('camera_id', 'terminal_01');

      const response = await fetch('http://localhost:8000/api/recognize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      
      const data = await response.json();
      drawHUD(data.results || []);

      if (data.results && data.results.length > 0) {
        const bestMatch = data.results[0];
        if (bestMatch.name !== "Unknown") {
          setLastRecognized(bestMatch.name);
          setTimeout(() => setLastRecognized(null), 3000);
        }
      }

    } catch (error) {
      console.error('Recognition error:', error);
    } finally {
      // Re-queue only if still streaming
      if (videoRef.current && videoRef.current.srcObject) {
        intervalRef.current = setTimeout(processFrame, 1000);
      }
    }
  };

  const drawHUD = (results) => {
    const canvas = drawCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    results.forEach(res => {
      const [top, right, bottom, left] = res.box;
      const isMatch = res.name !== "Unknown";
      const themeColor = isMatch ? '#22c55e' : '#ef4444';

      // 1. Simple Rectangular Box
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(left, top, right - left, bottom - top);

      // 2. Clean Label Background
      ctx.fillStyle = themeColor;
      const label = `${res.name.toUpperCase()} (${res.distance.toFixed(2)})`;
      ctx.font = 'bold 14px sans-serif';
      const textWidth = ctx.measureText(label).width;
      
      ctx.fillRect(left, top - 25, textWidth + 15, 25);

      // 3. Label Text
      ctx.fillStyle = '#fff';
      ctx.fillText(label, left + 7, top - 8);
    });
  };

  return (
    <div className="kiosk-layout">
      <div style={{ width: '100%', maxWidth: '800px', textAlign: 'center' }}>
        <h2 className="page-title" style={{ marginBottom: '0.5rem' }}>Attendance Terminal</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Please look at the camera to mark your attendance</p>

        <div className="glass-panel" style={{ padding: '0.75rem', background: '#000', marginBottom: '2rem' }}>
          <div className="video-container" style={{ border: 'none', boxShadow: 'none' }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: '0.5rem' }}></video>
            <canvas ref={drawCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}></canvas>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            
            {!isStreaming && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
                <CameraIcon size={48} color="var(--primary)" style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Terminal Standby</span>
              </div>
            )}
            
            {lastRecognized && (
              <div style={{ 
                position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(34, 197, 94, 0.95)', color: '#fff', padding: '1rem 2.5rem',
                borderRadius: '9999px', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'boot-reveal 0.3s ease-out'
              }}>
                <ShieldCheck size={24} />
                Attendance Marked: {lastRecognized}
              </div>
            )}
          </div>
        </div>

        <button 
          className="btn"
          onClick={isStreaming ? stopCamera : startCamera}
          style={{ padding: '1rem 3rem', borderRadius: '9999px', fontSize: '1rem' }}
        >
          {isStreaming ? <><StopCircle size={20} /> Stop Terminal</> : <><CameraIcon size={20} /> Start Terminal</>}
        </button>
      </div>
    </div>
  );
}

