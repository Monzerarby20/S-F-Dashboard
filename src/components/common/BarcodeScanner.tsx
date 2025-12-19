import { useBarcodeInput } from "@/hooks/useBarcodeInput";
import { Input } from "../ui/input";
import { Button } from "../ui/button"
import { ScanBarcode } from "lucide-react";

interface BarcodeScannerProps {
    placeholder: string;
    loading?: boolean;
    disabled?: boolean;
    autoFocus?: boolean;
    onSubmit: (value: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
    placeholder,
    loading = false,
    disabled = false,
    autoFocus = false,
    onSubmit,
})=> {
    const barcode = useBarcodeInput(40)
    const handleSubmit = () => {
        if(!barcode.value.trim()) return;
        onSubmit(barcode.value);
        barcode.setValue("");
    };

    return(
        <div className="flex gap-2">
            <Input
            type="text"
            placeholder={placeholder}
            value={barcode.value}
            onChange={barcode.onChange}
            autoFocus={autoFocus}
            disabled={disabled || loading}
            className="flex-1 text-lg p-4"
            onKeyDown={(e) => {
                if(e.key === "Enter") {
                    handleSubmit();
                }
            }}
            />

            <Button
                onClick={handleSubmit}
                disabled={loading || disabled || !barcode.value.trim()}
                className="px-6"
            >
                {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                ): (
                    <ScanBarcode className="h-4 w-4"/>
                )}
            </Button>
        </div>
    )
}