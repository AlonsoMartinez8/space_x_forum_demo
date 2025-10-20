export type Launch = {
  id: string;
  name: string;
  date_utc: string;
};

export type Message = {
  id: number;
  created_at: string;
  content: string | null;
  system_id: number;
  system_created_at: string;
  user_name: string;
  room_name: string;
};
