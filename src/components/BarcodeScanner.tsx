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
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerIdRef = useRef<string>('barcode-scanner-' + Math.random().toString(36).substring(7));
  const shouldInitScanner = useRef(false);

  useEffect(() => {
    checkCameraPermission();
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Initialize scanner after DOM is ready
  useEffect(() => {
    if (isScanning && shouldInitScanner.current) {
      shouldInitScanner.current = false;
      initializeScanner();
    }
  }, [isScanning]);

  const checkCameraPermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus('unsupported');
      setError('Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
      return;
    }

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setError('Camera access requires HTTPS. Please access this site using https:// or use localhost for development.');
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied');

      if (result.state === 'denied') {
        setError('Camera access has been blocked. Please enable camera permissions in your browser settings and refresh the page.');
      }

      result.addEventListener('change', () => {
        setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied');
        if (result.state === 'denied') {
          setError('Camera access has been blocked. Please enable camera permissions in your browser settings and refresh the page.');
        } else {
          setError('');
        }
      });
    } catch (err) {
      console.log('Permission API not supported, will prompt when camera is accessed');
    }
  };

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

  const startScanning = () => {
    setError('');
    shouldInitScanner.current = true;
    setIsScanning(true);
  };

  const initializeScanner = async () => {
    try {
      const scannerId = scannerIdRef.current;

      // Wait a tick to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if element exists
      const element = document.getElementById(scannerId);
      if (!element) {
        throw new Error(`Scanner element with id ${scannerId} not found in DOM`);
      }

      html5QrCodeRef.current = new Html5Qrcode(scannerId);

      const config = {
        fps: 20,
        qrbox: { width: 300, height: 100 },
        aspectRatio: 1.777778,
        disableFlip: true,
        formatsToSupport: [
          'EAN_13',
          'EAN_8',
          'UPC_A',
          'UPC_E',
          'CODE_128',
          'CODE_39',
          'ITF'
        ]
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
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      console.error('Error type:', err?.name);
      console.error('Error message:', err?.message);
      setIsScanning(false);

      const errorMessage = err?.message || err?.toString() || '';
      const errorName = err?.name || '';

      if (errorName === 'NotAllowedError' || errorMessage.includes('Permission denied') || errorMessage.includes('permission denied')) {
        setError('Camera access was denied. Please click "Allow" when your browser asks for camera permission, or enable it in your browser settings.');
      } else if (errorName === 'NotFoundError' || errorMessage.includes('not find') || errorMessage.includes('Requested device not found')) {
        setError('No camera found on this device. Please ensure your device has a camera or try a different device.');
      } else if (errorName === 'NotReadableError' || errorMessage.includes('Could not start video source') || errorMessage.includes('already in use')) {
        setError('Camera is already in use by another application. Please close other apps using the camera and try again.');
      } else if (errorName === 'NotSupportedError' || errorMessage.includes('secure') || errorMessage.includes('Only secure origins')) {
        setError('Camera access requires HTTPS. Please access this site using https:// or localhost.');
      } else if (errorName === 'OverconstrainedError' || errorMessage.includes('Overconstrained')) {
        setError('Unable to access the rear camera. Trying with available camera...');
        try {
          const fallbackConfig = {
            fps: 20,
            qrbox: { width: 300, height: 100 },
            aspectRatio: 1.777778,
            disableFlip: true,
            formatsToSupport: [
              'EAN_13',
              'EAN_8',
              'UPC_A',
              'UPC_E',
              'CODE_128',
              'CODE_39',
              'ITF'
            ]
          };
          await html5QrCodeRef.current?.start(
            { facingMode: 'user' },
            fallbackConfig,
            (decodedText: string) => {
              console.log('Barcode detected:', decodedText);
              stopScanning();
              onScan(decodedText);
            },
            () => {}
          );
          setError('');
        } catch (retryErr) {
          console.error('Retry with front camera also failed:', retryErr);
          setError('Unable to access any camera on this device.');
        }
      } else if (errorMessage.includes('Camera access is only supported in secure contexts')) {
        setError('Camera access requires HTTPS. Please access this site using https:// or localhost.');
      } else if (errorMessage.includes('not found in DOM')) {
        setError('Scanner initialization failed. Please try again.');
      } else {
        setError(`Unable to access camera: ${errorMessage || 'Unknown error'}. Check browser console for details.`);
      }
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
                  <p className="text-sm text-red-700 leading-relaxed">{error}</p>
                  {permissionStatus === 'denied' && (
                    <div className="mt-3 text-xs text-red-600 space-y-1">
                      <p className="font-semibold">How to enable camera access:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Chrome: Click the camera icon in the address bar</li>
                        <li>Firefox: Click the camera icon in the address bar</li>
                        <li>Safari: Go to Settings → Safari → Camera</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={startScanning}
                disabled={permissionStatus === 'unsupported'}
                className="w-full flex items-center justify-center space-x-2 bg-slate-900 text-white py-4 rounded-lg font-semibold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 font-semibold mb-1">Scanning Tips:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Hold the barcode 6-8 inches from the camera</li>
                  <li>• Keep the barcode centered and horizontal</li>
                  <li>• Ensure good lighting on the barcode</li>
                  <li>• Hold steady for 1-2 seconds</li>
                </ul>
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
