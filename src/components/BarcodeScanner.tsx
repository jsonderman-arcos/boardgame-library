import { useState, useRef, useEffect } from 'react';
import { Camera, X, Loader } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  onManualEntry: () => void;
}

export default function BarcodeScanner({ onScan, onClose, onManualEntry }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerIdRef = useRef<string>('barcode-scanner-' + Math.random().toString(36).substring(7));

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const startScanning = async () => {
    setError('');
    setIsScanning(true);

    try {
      const scannerId = scannerIdRef.current;
      html5QrCodeRef.current = new Html5Qrcode(scannerId);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.777778
      };

      const qrCodeSuccessCallback = (decodedText: string) => {
        console.log('Barcode detected:', decodedText);
        stopScanning();
        onScan(decodedText);
      };

      const qrCodeErrorCallback = () => {
        // Silent - this fires frequently when no barcode is detected
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      );
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please ensure you have granted camera permissions and that your device supports camera access.');
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

              <div className="text-center">
                <button
                  onClick={onManualEntry}
                  className="text-sm text-slate-600 hover:text-slate-900 underline transition"
                >
                  Can't scan? Search by title instead
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <div id={scannerIdRef.current} className="w-full" />
              </div>

              <div className="flex items-center justify-center space-x-2 text-slate-600">
                <Loader className="w-5 h-5 animate-spin" />
                <span className="text-sm">Scanning for barcode...</span>
              </div>

              <button
                onClick={async () => {
                  await stopScanning();
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
