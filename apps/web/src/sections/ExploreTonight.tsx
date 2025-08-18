import { useNavigate } from "react-router-dom";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  position: { lat: number; lng: number };
  neighborhood: string;
  category: string;
  hot?: boolean;
  instagramUrl?: string | null;
  heroImageUrl?: string | null;
  website?: string | null;
  cuisineTags?: string[];
};

const handleRestaurantClick = (restaurant: Restaurant) => {
  const navigate = useNavigate();
  navigate(`/r/${restaurant.slug}`);
};