/* StudentStay listing data.
   In a production site this would come from a database / API.
   Prices are in Sierra Leonean Leones (SLE) per month. */
const LISTINGS = [
  {
    id: "wilberforce-court",
    name: "Wilberforce Court",
    location: "Wilberforce",
    distance: "hillside residence with views over Freetown harbour",
    price: 1800,
    type: "Single room",
    facilities: ["Wi-Fi", "Water", "Electricity", "Security", "Parking"],
    image: "images/wilberforce-court.jpg",
    alt: "Wilberforce Court, a three-storey white residence with navy balconies and a gated entrance",
    beds: 1,
    bathroom: "Private",
    available: "1 November 2026",
    description:
      "A gated three-storey residence with balcony access to every room. Each furnished single room has its own bathroom, a study desk and a wardrobe. Security guards are on duty day and night.",
    provider: "Kamara Properties",
    phone: "+232 77 584129",
    featured: true
  },
  {
    id: "kingtom-studios",
    name: "Kingtom Studios",
    location: "Kingtom",
    distance: "short ride to central Freetown and Limkokwing University",
    price: 2200,
    type: "Apartment / studio",
    facilities: ["Wi-Fi", "Water", "Electricity", "Security"],
    image: "images/kingtom-studios.jpg",
    alt: "Kingtom Studios, a white studio apartment block with air-conditioning units and a sea view",
    beds: 1,
    bathroom: "Private",
    available: "Available now",
    description:
      "Self-contained studios with air-conditioning, a kitchenette and a private bathroom. Suits a student who wants privacy and space to cook and study.",
    provider: "City Homes SL",
    phone: "+232 76636753",
    featured: true
  },
  {
    id: "fourah-bay-lodge",
    name: "Fourah Bay Lodge",
    location: "Fourah Bay",
    distance: "8 min walk to Fourah Bay College",
    price: 1200,
    type: "Shared room",
    facilities: ["Water", "Electricity", "Security"],
    image: "images/fourah-bay-lodge.jpg",
    alt: "Fourah Bay Lodge, a cream residence with navy balconies overlooking the bay",
    beds: 2,
    bathroom: "Shared",
    available: "Available now",
    description:
      "A twin room shared with one other student. A good option if you want to keep costs low and live close to campus. The compound is gated and has a night watchman.",
    provider: "Mount Aureol Rentals",
    phone: "+232 88175722",
    featured: true
  },
  {
    id: "brookfields-hall",
    name: "Brookfields Hall",
    location: "Brookfields",
    distance: "5 min walk to the main bus route",
    price: 1500,
    type: "Single room",
    facilities: ["Wi-Fi", "Water", "Security"],
    image: "images/brookfields-hall.jpg",
    alt: "Brookfields Hall, a three-storey residence with a covered entrance and front steps",
    beds: 1,
    bathroom: "Shared",
    available: "1 December 2026",
    description:
      "A managed hall of residence with a staffed reception at the entrance. Kitchens and bathrooms are shared on each floor and cleaned daily.",
    provider: "Brookfields Housing",
    phone: "+232 78093686",
    featured: false
  },
  {
    id: "tower-hill-house",
    name: "Tower Hill House",
    location: "Tower Hill",
    distance: "10 min walk to central Freetown",
    price: 1800,
    type: "Shared room",
    facilities: ["Water", "Security"],
    image: "images/tower-hill-house.jpg",
    alt: "Tower Hill House, a white residence with a navy sign above a wide entrance staircase",
    beds: 3,
    bathroom: "Shared",
    available: "1 November 2026",
    description:
      "The lowest-priced place on StudentStay. Basic and clean, shared with one other student, with water storage on site.",
    provider: "Tower Hill Lodge",
    phone: "+232 75209783",
    featured: false
  },
  {
    id: "mount-aureol-residence",
    name: "Mount Aureol Residence",
    location: "Mount Aureol",
    distance: "on the hill beside Fourah Bay College campus",
    price: 1500,
    type: "Single room",
    facilities: ["Wi-Fi", "Water", "Electricity", "Security"],
    image: "images/mount-aureol-residence.jpg",
    alt: "Mount Aureol Residence, a four-storey residence on a hill with views of the city and sea",
    beds: 1,
    bathroom: "Shared",
    available: "Available now",
    description:
      "A single room close to lecture halls, with a cooler breeze and quiet floors for studying. Electricity has solar backup.",
    provider: "Hillside Homes",
    phone: "+232 75391480",
    featured: false
  }
];

const LOCATIONS = ["Brookfields", "Fourah Bay", "Kingtom", "Mount Aureol", "Tower Hill", "Wilberforce"];
const ROOM_TYPES = ["Single room", "Shared room", "Apartment / studio"];
const FACILITIES = ["Wi-Fi", "Water", "Electricity", "Security", "Parking"];
