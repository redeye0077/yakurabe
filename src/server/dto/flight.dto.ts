import { FlightType } from "@/schemas/flight";
import { FlightSystem } from "@/schemas/flight-system";

export type FlightListItemDto = {
  id: string;
  name: string;
  price: number;
  flightType: FlightType;
  flightSystem: FlightSystem | null; // シャフト一体型は null
};
