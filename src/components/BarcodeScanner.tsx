import { useState, useRef, useEffect } from 'react';
import { Camera, X, Loader } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [detectedBarcode, setDetectedBarcode] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startScanning = async () => {
    setError('');
    setIsScanning(true);

    try {
      if (!('BarcodeDetector' in window)) {
        setError('Barcode scanning is not supported in this browser. Please use Chrome or Edge on desktop, or Chrome on Android.');
        setIsScanning(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const barcodeDetector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
        });

        scanIntervalRef.current = window.setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const barcode = barcodes[0].rawValue;
                setDetectedBarcode(barcode);
                stopScanning();
                onScan(barcode);
              }
            } catch (err) {
              console.error('Error detecting barcode:', err);
            }
          }
        }, 100);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please ensure you have granted camera permissions.');
      setIsScanning(false);
    }
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Add Game</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            title="Close"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6">
          {!isScanning ? (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Point your camera at the barcode on the back of your board game box. The barcode is typically a 12 or 13 digit number with vertical lines.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={startScanning}
                className="w-full flex items-center justify-center space-x-2 bg-slate-900 text-white py-4 rounded-lg font-semibold hover:bg-slate-800 transition"
              >
                <Camera className="w-5 h-5" />
                <span>Start Scanning</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-4 border-white rounded-lg w-64 h-40 opacity-50"></div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2 text-slate-600">
                <Loader className="w-5 h-5 animate-spin" />
                <span className="text-sm">Scanning for barcode...</span>
              </div>

              <button
                onClick={() => {
                  stopScanning();
                  setIsScanning(false);
                }}
                className="w-full py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
