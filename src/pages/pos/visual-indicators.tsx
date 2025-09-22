import { Circle, CheckCircle } from "lucide-react";

interface VisualIndicatorsProps {
  totalQuantity: number;
  scannedQuantity: number;
  className?: string;
}

export function VisualIndicators({ totalQuantity, scannedQuantity, className = "" }: VisualIndicatorsProps) {
  const indicators = Array.from({ length: totalQuantity }, (_, index) => {
    const isScanned = index < scannedQuantity;
    return (
      <div
        key={index}
        className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 ${
          isScanned
            ? "bg-green-500 border-green-500 text-white"
            : "bg-red-500 border-red-500 text-white"
        }`}
      >
        {isScanned ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <Circle className="w-4 h-4" />
        )}
      </div>
    );
  });

  return (
    <div className={`flex gap-1 flex-wrap ${className}`}>
      {indicators}
    </div>
  );
}

export default VisualIndicators;