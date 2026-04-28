import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface Props {
  value: string;
  className?: string;
}

export default function Barcode({ value, className }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current && value) {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        width: 2.5,
        height: 90,
        displayValue: true,
        fontSize: 16,
        margin: 12,
        background: "#ffffff",
        lineColor: "#0f3a2e",
      });
    }
  }, [value]);
  return <svg ref={ref} className={className} />;
}
