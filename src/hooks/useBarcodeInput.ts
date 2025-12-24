import { useState } from "react";

export const useBarcodeInput = (maxLength = 20) =>
{
    const [value,setValue] = useState<string>("");

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        
        let v = e.target.value;
       v = v.replace(/[^a-zA-Z0-9-./]/g, "")


        v = v.slice(0, maxLength);

        e.target.value = v;

        setValue(v);
    }

    return {value,setValue,onChange};
}