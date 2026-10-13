import { FlightSystem } from "@/schemas/flight-system";

export type ShaftListItemDto = {
  id: string;
  name: string;
  price: number;
  flightSystem: FlightSystem; // 登録フォームで、選んだフライトと規格が合うシャフトだけを表示するのに使う
};
