export type Profile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  avatar_updated_at: string | null;
  phone_country_code: string | null;
  phone_number: string | null;
  timezone?: string | null;
};
