import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface Props {
  value: string;
  className?: string;
  printMode?: boolean; // true = optimized for print/scan
}

export default function Barcode({ value, className, printMode = false }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current && value) {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        width: printMode ? 1.5 : 2,
        height: printMode ? 60 : 80,
        displayValue: true,
        fontSize: printMode ? 12 : 14,
        margin: printMode ? 4 : 10,
        background: "#ffffff",
        lineColor: "#000000", // hitam pekat agar bisa discan
      });
    }
  }, [value, printMode]);
  return <svg ref={ref} className={className} />;
}
