import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Scan, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isScanning?: boolean;
  disabled?: boolean;
  placeholder?: string;
  showInstructions?: boolean;
}

export function BarcodeScanner({ 
  onScan, 
  isScanning = false, 
  disabled = false, 
  placeholder = "امسح الباركود أو اكتبه يدوياً...",
  showInstructions = true 
}: BarcodeScannerProps) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [lastScanResult, setLastScanResult] = useState<{
    status: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount and when not disabled
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  // Global keydown handler to focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus input when typing (excluding when typing in other inputs)
      if (
        !disabled &&
        e.target === document.body &&
        inputRef.current &&
        e.key.length === 1
      ) {
        inputRef.current.focus();
        setBarcodeInput(e.key);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim() || disabled) return;

    onScan(barcodeInput.trim());
    setBarcodeInput("");
    
    // Clear previous result after a delay
    if (lastScanResult) {
      setTimeout(() => setLastScanResult(null), 3000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcodeInput(value);

    // Auto-submit if barcode looks complete (13 digits for EAN-13)
    if (value.length >= 13 && /^\d+$/.test(value)) {
      setTimeout(() => {
        onScan(value);
        setBarcodeInput("");
      }, 100);
    }
  };

  const getScanStatusIcon = () => {
    if (!lastScanResult) return null;
    
    switch (lastScanResult.status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Scan className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={barcodeInput}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-12 pr-4 py-3 text-lg font-mono"
            autoComplete="off"
            autoFocus
          />
          {isScanning && (
            <div className="absolute right-3 top-3">
              <div className="animate-pulse">
                <Badge variant="default" className="bg-blue-600">
                  جاري المسح...
                </Badge>
              </div>
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={!barcodeInput.trim() || disabled || isScanning}
          className="w-full"
          size="lg"
        >
          <Scan className="h-4 w-4 mr-2" />
          {isScanning ? "جاري المسح..." : "مسح الباركود"}
        </Button>
      </form>

      {/* Scan Result Status */}
      {lastScanResult && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border ${
          lastScanResult.status === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : lastScanResult.status === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          {getScanStatusIcon()}
          <span className="text-sm font-medium">{lastScanResult.message}</span>
        </div>
      )}

      {/* Instructions */}
      {showInstructions && (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            يمكنك استخدام ماسح الباركود أو الكتابة اليدوية
          </p>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span>• ماسح D1/D2 متصل</span>
            <span>• مسح تلقائي عند 13 رقم</span>
            <span>• اضغط Enter للتأكيد</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default BarcodeScanner;