import { FlightType } from "@/schemas/flight";

export type FlightListItemDto = {
  id: string;
  name: string;
  price: number;
  flightType: FlightType;
};
