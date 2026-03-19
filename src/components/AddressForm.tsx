import { useEffect, useRef, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";

interface LocalityData {
  postalCode: string;
  name: string;
}





type FieldState = "idle" | "loading" | "success" | "error";

function AddressForm() {

  const [postalCode, setPostalCode] = useState("");
  const [locality, setLocality] = useState("");
  const [localityData, setLocalityData] = useState<LocalityData[]>([]);
  const [postalOptions, setPostalOptions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [activeField, setActiveField] = useState<"postal" | "locality" | null>(null);
  const [fieldState, setFieldState] = useState<FieldState>("idle");

  //focused index for PLZ dropdown 
  const [focusedPostalIndex, setFocusedPostalIndex] = useState(-1);
  //   focused index for Locality dropdown
  const [focusedLocalityIndex, setFocusedLocalityIndex] = useState(-1);

  // convert to dropdown
  const [plzOptions, setPlzOptions] = useState<string[]>([]);

  const [postalSuccess, setPostalSuccess] = useState(false);
  const [localitySuccess, setLocalitySuccess] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const plzDropdownRef = useRef<HTMLDivElement>(null);

  const debouncedPostalCode = useDebounce(postalCode, 1000);
  const debouncedLocality = useDebounce(locality, 1000);

  const MAX_DROPDOWN = 15;


  // PLZ → Locality
  useEffect(() => {
    if (!debouncedPostalCode || activeField !== "postal") return;

    if (debouncedPostalCode.length !== 5) {
    setFieldState("idle");
    setLocality("");
    setError("");
    return;
  }

    setLoading(true);
    setFieldState("loading");
    setError("");
    setPostalSuccess(false);
    setLocalitySuccess(false);

    fetch(`https://openplzapi.org/de/Localities?postalCode=${debouncedPostalCode}`)
      .then((res) => res.json())
      .then((data: LocalityData[]) => {
        if (!data || data.length === 0) {
          setError("Invalid postal code");
          setFieldState("error");
          setLocality("");
          setPostalOptions([]);
          setPlzOptions([]);
          setPostalSuccess(false);
          setLocalitySuccess(false);
          return;
        }
        setLocality(data[0].name);
        setPostalOptions([]);
        setPlzOptions([]);
        setLocalityData([]);
        setFieldState("success");
        setPostalSuccess(true);
        setLocalitySuccess(true);
      })
      .catch(() => {
        setError("Invalid postal code");
        setFieldState("error");
        setLocality("");
        setPostalOptions([]);
        setPlzOptions([]);
        setPostalSuccess(false);
        setLocalitySuccess(false);
      })
      .finally(() => setLoading(false));
  }, [debouncedPostalCode]);


  // Locality → PLZ
  useEffect(() => {
    if (!debouncedLocality || activeField !== "locality") return;

    setLoading(true);
    setFieldState("loading");
    setError("");
    setPostalSuccess(false);
    setLocalitySuccess(false);

    fetch(`https://openplzapi.org/de/Localities?name=${encodeURIComponent(debouncedLocality)}`)
      .then((res) => res.json())
      .then((data: LocalityData[]) => {
        if (!data || data.length === 0) {
          setError("Locality not found");
          setFieldState("error");
          setPostalOptions([]);
          setPlzOptions([]);
          setLocalityData([]);
          setPostalSuccess(false);
          setLocalitySuccess(false);
          return;
        }

        setLocalityData(data);
        const codes = [...new Set(data.map((item) => item.postalCode))];

        if (codes.length === 1) {
          // 1 PLZ → fill
          setPostalCode(codes[0]);
          setLocality(data[0].name);
          setPostalOptions([]);
          setPlzOptions([]);
          setLocalityData([]);
          setActiveField(null);
          setFieldState("success");
          setPostalSuccess(true);
          setLocalitySuccess(true);
        } else {
          // more PLZ → convert plz to  dropdown
          setPlzOptions(codes.slice(0, MAX_DROPDOWN));
          setPostalOptions([]);
          setPostalCode(""); // clear input plz
          setFieldState("success");
        }
        setError("");
      })
      .catch(() => {
        setError("Locality not found");
        setFieldState("error");
        setPostalOptions([]);
        setPlzOptions([]);
        setLocalityData([]);
        setPostalSuccess(false);
        setLocalitySuccess(false);
      })
      .finally(() => setLoading(false));
  }, [debouncedLocality]);


  // close dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPostalOptions([]);
        setPlzOptions([]);
        setFocusedPostalIndex(-1);
        setFocusedLocalityIndex(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  // PLZ dropdown options
  const handleSelectPlzOption = (code: string) => {
    const selectedLocality = localityData.find((item) => item.postalCode === code)?.name ?? "";
    setPostalCode(code);
    setLocality(selectedLocality);
    setPlzOptions([]);
    setPostalOptions([]);
    setLocalityData([]);
    setActiveField(null);
    setFieldState("success");
    setFocusedPostalIndex(-1);
    setPostalSuccess(true);
    setLocalitySuccess(true);
  };

  // Locality dropdown option
  const handleSelectLocalityOption = (code: string) => {
    const selectedLocality = localityData.find((item) => item.postalCode === code)?.name ?? "";
    setActiveField(null);
    setPostalCode(code);
    setLocality(selectedLocality);
    setPostalOptions([]);
    setPlzOptions([]);
    setLocalityData([]);
    setFieldState("success");
    setFocusedLocalityIndex(-1);
    setPostalSuccess(true);
    setLocalitySuccess(true);
  };


  // PLZ input key navigation
  const handlePostalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (plzOptions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedPostalIndex((i) => Math.min(i + 1, plzOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedPostalIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && focusedPostalIndex >= 0) {
      e.preventDefault();
      handleSelectPlzOption(plzOptions[focusedPostalIndex]);
    }
  };

  // Locality input key navigation
  const handleLocalityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (postalOptions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedLocalityIndex((i) => Math.min(i + 1, postalOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedLocalityIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && focusedLocalityIndex >= 0) {
      e.preventDefault();
      handleSelectLocalityOption(postalOptions[focusedLocalityIndex]);
    }
  };


  const borderColor = () => {
    if (fieldState === "error") return "#e53e3e";
    if (fieldState === "success") return "#38a169";
    return "#555";
  };

  const inputStyle: React.CSSProperties = {
    color: "white",
    backgroundColor: "#222",
    width: "100%",
    padding: "8px 36px 8px 8px",
    marginBottom: "4px",
    border: `1.5px solid ${borderColor()}`,
    borderRadius: "6px",
    outline: "none",
    boxSizing: "border-box",
    fontSize: "14px",
  };

  const totalPlzResults = new Set(localityData.map((d) => d.postalCode)).size;

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2 style={{ color: "white" }}>German Address Validator</h2>

{/* Locality Input + Dropdown */}
      <label htmlFor="locality" style={{ color: "#aaa", fontSize: "12px" }}>
        Locality
      </label>
      <div style={{ position: "relative", marginBottom: "16px" }} ref={dropdownRef}>
        <input
          id="locality"
          placeholder="Berlin"
          value={locality}
          aria-label="Locality"
          aria-expanded={postalOptions.length > 0}
          aria-autocomplete="list"
          aria-controls="postal-options"
          onKeyDown={handleLocalityKeyDown}
          onChange={(e) => {
            setActiveField("locality");
            setLocality(e.target.value);
            setPostalOptions([]);
            setPlzOptions([]);
            setFieldState("idle");
            setError("");
            setPostalSuccess(false);
            setLocalitySuccess(false);
            if (!e.target.value) {
              setPostalCode("");
              setPostalOptions([]);
              setPlzOptions([]);
              setLocalityData([]);
              setFieldState("idle");
            }
          }}
          style={inputStyle}
        />

        {/* Locality state icon */}
        {localitySuccess && postalOptions.length === 0 && (
          <span style={{ position: "absolute", right: "10px", top: "9px", color: "#38a169" }}>✓</span>
        )}
        {loading && activeField === "locality" && (
          <span style={{ position: "absolute", right: "10px", top: "9px", color: "#aaa" }}>…</span>
        )}

        {/* Locality Dropdown */}
        {postalOptions.length > 0 && (
          <ul
            id="postal-options"
            role="listbox"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "#2a2a2a",
              border: "1px solid #555",
              borderRadius: "6px",
              maxHeight: "220px",
              overflowY: "auto",
              margin: 0,
              padding: 0,
              listStyle: "none",
              zIndex: 10,
            }}
          >
            {postalOptions.map((code, index) => {
              const name = localityData.find((item) => item.postalCode === code)?.name ?? "";
              return (
                <li
                  key={code}
                  role="option"
                  aria-selected={index === focusedLocalityIndex}
                  onClick={() => handleSelectLocalityOption(code)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "14px",
                    backgroundColor: index === focusedLocalityIndex ? "#3a3a3a" : "transparent",
                    borderBottom: "1px solid #333",
                  }}
                  onMouseEnter={() => setFocusedLocalityIndex(index)}
                >
                  <span style={{ color: "#aaa", marginRight: "8px" }}>{code}</span>
                  {name}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* PLZ Input */}
      <label htmlFor="postalCode" style={{ color: "#aaa", fontSize: "12px" }}>
        Postal Code
        {plzOptions.length > 0 && (
          <span style={{ color: "#f6c90e", marginLeft: "6px", fontSize: "11px" }}>
            ▾ Select a postal code
          </span>
        )}
      </label>
      <div style={{ position: "relative", marginBottom: "16px" }} ref={plzDropdownRef}>
        <input
          id="postalCode"
          placeholder={plzOptions.length > 0 ? "Select a postal code below..." : "10115"}
          value={postalCode}
          maxLength={5}
          inputMode="numeric"
          aria-label="Postal Code"
          aria-invalid={fieldState === "error" && activeField !== "locality"}
          aria-expanded={plzOptions.length > 0}
          aria-autocomplete="list"
          aria-controls="plz-options"
          onKeyDown={handlePostalKeyDown}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            setActiveField("postal");
            setPostalCode(val);
            setFieldState("idle");
            setError("");
            setPostalSuccess(false);
            setLocalitySuccess(false);
            setPlzOptions([]); // kullanıcı yazmaya başlarsa PLZ dropdown kapanır
            if (!val) {
              setLocality("");
              setPostalOptions([]);
              setPlzOptions([]);
              setLocalityData([]);
              setFieldState("idle");
            }
          }}
          style={{
            ...inputStyle,
            border: plzOptions.length > 0
              ? "1.5px solid #f6c90e"
              : `1.5px solid ${borderColor()}`,
            color: plzOptions.length > 0 ? "#aaa" : "white",
          }}
        />

        {/* PLZ state icon */}
        {postalSuccess && plzOptions.length === 0 && (
          <span style={{ position: "absolute", right: "10px", top: "9px", color: "#38a169" }}>✓</span>
        )}
        {plzOptions.length > 0 && (
          <span style={{ position: "absolute", right: "10px", top: "9px", color: "#f6c90e", fontSize: "12px" }}>▾</span>
        )}
        {fieldState === "error" && activeField !== "locality" && (
          <span
            onClick={() => {
              setPostalCode("");
              setPostalOptions([]);
              setPlzOptions([]);
              setLocality("");
              setError("");
              setPostalSuccess(false);
              setLocalitySuccess(false);
              setFieldState("idle");
            }}
            style={{
              position: "absolute",
              right: "10px",
              top: "9px",
              color: "#e53e3e",
              cursor: "pointer",
            }}
          >
            ✕
          </span>
        )}
        {loading && activeField === "postal" && (
          <span style={{ position: "absolute", right: "10px", top: "9px", color: "#aaa" }}>…</span>
        )}

        {/* PLZ Dropdown */}
        {plzOptions.length > 0 && (
          <ul
            id="plz-options"
            role="listbox"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "#2a2a2a",
              border: "1px solid #f6c90e",
              borderRadius: "6px",
              maxHeight: "220px",
              overflowY: "auto",
              margin: 0,
              padding: 0,
              listStyle: "none",
              zIndex: 10,
            }}
          >
            {plzOptions.map((code, index) => {
              const name = localityData.find((item) => item.postalCode === code)?.name ?? "";
              return (
                <li
                  key={code}
                  role="option"
                  aria-selected={index === focusedPostalIndex}
                  onClick={() => handleSelectPlzOption(code)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    color: "white",
                    fontSize: "14px",
                    backgroundColor: index === focusedPostalIndex ? "#3a3a3a" : "transparent",
                    borderBottom: "1px solid #333",
                  }}
                  onMouseEnter={() => setFocusedPostalIndex(index)}
                >
                  <span style={{ color: "#f6c90e", marginRight: "8px" }}>{code}</span>
                  {name}
                </li>
              );
            })}

            {totalPlzResults > MAX_DROPDOWN && (
              <li style={{ padding: "8px 12px", color: "#aaa", fontSize: "12px", fontStyle: "italic" }}>
                {totalPlzResults - MAX_DROPDOWN} more results — type more to narrow down
              </li>
            )}
          </ul>
        )}
      </div>


      

      {/* error message */}
      <div aria-live="polite">
        {error && <p style={{ color: "#e53e3e", fontSize: "13px", margin: 0 }}>{error}</p>}
      </div>
    </div>
  );
}

export default AddressForm;
