const BASE_URL = "https://openplzapi.org/de";



export const fetchByPostalCode = async (plz: string) => {
  const res = await fetch(`${BASE_URL}/Localities?postalCode=${plz}`);
  if (!res.ok) throw new Error("Invalid postal code");
  return res.json();
};




export const fetchByLocality = async (locality: string) => {
  const res = await fetch(`${BASE_URL}/Localities?name=${encodeURIComponent(locality)}`);
  if (!res.ok) throw new Error("Locality not found");
  return res.json();
};

