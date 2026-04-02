


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."degree_type" AS ENUM (
    'associate',
    'bachelor',
    'master',
    'doctorate',
    'diploma'
);


ALTER TYPE "public"."degree_type" OWNER TO "postgres";


CREATE TYPE "public"."language_proficiency" AS ENUM (
    'native',
    'c2',
    'c1',
    'b2',
    'b1',
    'a2',
    'a1'
);


ALTER TYPE "public"."language_proficiency" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_conversation"("p_conversation_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "sql"
    AS $$
  update conversation
  set archived_by =
    case
      when p_user_id = any(archived_by) then archived_by
      else array_append(archived_by, p_user_id)
    end
  where id = p_conversation_id;
$$;


ALTER FUNCTION "public"."archive_conversation"("p_conversation_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform public.upsert_public_user_from_auth(
    new.id,
    new.email,
    new.phone,
    new.raw_user_meta_data
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_conversation_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "sql"
    AS $$
  update conversation
  set unread_by = array_remove(unread_by, p_user_id)
  where id = p_conversation_id;
$$;


ALTER FUNCTION "public"."mark_conversation_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_conversation_as_unread"("p_conversation_id" "uuid", "p_receiver_id" "uuid") RETURNS "void"
    LANGUAGE "sql"
    AS $$
  update conversation
  set
    unread_by = (
      case
        when p_receiver_id = any(unread_by) then unread_by
        else array_append(unread_by, p_receiver_id)
      end
    ),
    last_message_at = now()
  where id = p_conversation_id;
$$;


ALTER FUNCTION "public"."mark_conversation_as_unread"("p_conversation_id" "uuid", "p_receiver_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_mentor_review_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE mentors SET
      rating_avg = COALESCE((SELECT AVG(rating)::decimal(2,1) FROM mentor_reviews WHERE mentor_id = OLD.mentor_id), 0),
      review_count = (SELECT COUNT(*) FROM mentor_reviews WHERE mentor_id = OLD.mentor_id)
    WHERE id = OLD.mentor_id;
    RETURN OLD;
  ELSE
    UPDATE mentors SET
      rating_avg = COALESCE((SELECT AVG(rating)::decimal(2,1) FROM mentor_reviews WHERE mentor_id = NEW.mentor_id), 0),
      review_count = (SELECT COUNT(*) FROM mentor_reviews WHERE mentor_id = NEW.mentor_id)
    WHERE id = NEW.mentor_id;
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_mentor_review_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_public_user_from_auth"("p_user_id" "uuid", "p_email" "text", "p_phone" "text", "p_user_meta" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  base_username text;
  username_value text;
  role_value text;
begin
  base_username := nullif(
    btrim(
      coalesce(
        p_user_meta ->> 'username',
        p_email,
        p_phone,
        p_user_id::text
      )
    ),
    ''
  );

  username_value := base_username;

  if exists (
    select 1
    from public.users
    where username = username_value
      and id <> p_user_id
  ) then
    username_value := base_username || '-' || left(p_user_id::text, 8);
  end if;

  role_value := case
    when p_user_meta ->> 'role' in ('student', 'mentor') then p_user_meta ->> 'role'
    else null
  end;

  insert into public.users (id, username, role)
  values (p_user_id, username_value, role_value)
  on conflict (id) do update
  set
    username = case
      when public.users.username = '' then excluded.username
      else public.users.username
    end,
    role = coalesce(public.users.role, excluded.role);
end;
$$;


ALTER FUNCTION "public"."upsert_public_user_from_auth"("p_user_id" "uuid", "p_email" "text", "p_phone" "text", "p_user_meta" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" bigint NOT NULL,
    "mentor_id" "uuid" DEFAULT "auth"."uid"(),
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "start_time" timestamp without time zone,
    "end_time" timestamp without time zone,
    "status" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


COMMENT ON TABLE "public"."bookings" IS 'メンターの予約情報';



ALTER TABLE "public"."bookings" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."bookings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."conversation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mentor_id" "uuid" DEFAULT "auth"."uid"(),
    "student_id" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_message_at" timestamp with time zone,
    "unread_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "archived_by" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL
);


ALTER TABLE "public"."conversation" OWNER TO "postgres";


COMMENT ON TABLE "public"."conversation" IS '会話の箱';



CREATE TABLE IF NOT EXISTS "public"."mentor_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mentor_id" "uuid" NOT NULL,
    "day_of_week" smallint NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "is_enabled" boolean DEFAULT true NOT NULL,
    CONSTRAINT "mentor_availability_check" CHECK (("end_time" > "start_time")),
    CONSTRAINT "mentor_availability_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."mentor_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentor_expertise" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mentor_id" "uuid" NOT NULL,
    "expertise" "text" NOT NULL
);


ALTER TABLE "public"."mentor_expertise" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentor_favorites" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "mentor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."mentor_favorites" OWNER TO "postgres";


ALTER TABLE "public"."mentor_favorites" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."mentor_favorites_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."mentor_languages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mentor_id" "uuid" NOT NULL,
    "language_code" "text" NOT NULL,
    "language_name" "text" NOT NULL,
    "proficiency_level" "public"."language_proficiency" NOT NULL
);


ALTER TABLE "public"."mentor_languages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentor_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mentor_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rating" smallint NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mentor_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."mentor_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "country_code" "text" NOT NULL,
    "phone_country_code" "text" NOT NULL,
    "phone_number" "text" NOT NULL,
    "avatar_url" "text",
    "introduction" "text" NOT NULL,
    "work_experience" "text" NOT NULL,
    "motivation" "text" NOT NULL,
    "headline" "text" NOT NULL,
    "video_url" "text",
    "timezone" "text" DEFAULT 'UTC'::"text" NOT NULL,
    "hourly_rate" integer NOT NULL,
    "has_no_degree" boolean DEFAULT false NOT NULL,
    "university" "text",
    "degree" "text",
    "degree_type" "public"."degree_type",
    "specialization" "text",
    "rating_avg" numeric(2,1) DEFAULT 0,
    "review_count" integer DEFAULT 0,
    "lessons_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "stripe_account_id" "text",
    "stripe_onboarding_completed" boolean DEFAULT false,
    CONSTRAINT "mentors_hourly_rate_check" CHECK ((("hourly_rate" >= 10) AND ("hourly_rate" <= 200)))
);


ALTER TABLE "public"."mentors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message" (
    "id" bigint NOT NULL,
    "conversation_id" "uuid" DEFAULT "gen_random_uuid"(),
    "sender_id" "uuid" DEFAULT "auth"."uid"(),
    "body" "text",
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."message" OWNER TO "postgres";


COMMENT ON TABLE "public"."message" IS 'conversationテーブルの中の発言';



ALTER TABLE "public"."message" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."message_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "mentor_id" "uuid" NOT NULL,
    "stripe_payment_intent_id" "text" NOT NULL,
    "amount" integer NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_id" "uuid" NOT NULL,
    "mentor_id" "uuid" NOT NULL,
    "stripe_payout_id" "text",
    "amount" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "username" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "role" "text",
    "first_name" "text",
    "last_name" "text",
    "avatar_url" "text",
    "phone_country_code" "text",
    "phone_number" "text",
    "timezone" "text",
    "avatar_updated_at" timestamp with time zone
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentor_availability"
    ADD CONSTRAINT "mentor_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentor_expertise"
    ADD CONSTRAINT "mentor_expertise_mentor_id_expertise_key" UNIQUE ("mentor_id", "expertise");



ALTER TABLE ONLY "public"."mentor_expertise"
    ADD CONSTRAINT "mentor_expertise_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentor_favorites"
    ADD CONSTRAINT "mentor_favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentor_favorites"
    ADD CONSTRAINT "mentor_favorites_user_id_mentor_id_key" UNIQUE ("user_id", "mentor_id");



ALTER TABLE ONLY "public"."mentor_languages"
    ADD CONSTRAINT "mentor_languages_mentor_id_language_code_key" UNIQUE ("mentor_id", "language_code");



ALTER TABLE ONLY "public"."mentor_languages"
    ADD CONSTRAINT "mentor_languages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentor_reviews"
    ADD CONSTRAINT "mentor_reviews_mentor_id_user_id_key" UNIQUE ("mentor_id", "user_id");



ALTER TABLE ONLY "public"."mentor_reviews"
    ADD CONSTRAINT "mentor_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentors"
    ADD CONSTRAINT "mentors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentors"
    ADD CONSTRAINT "mentors_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."message"
    ADD CONSTRAINT "message_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_booking_id_unique" UNIQUE ("booking_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_stripe_pi_unique" UNIQUE ("stripe_payment_intent_id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_stripe_payout_unique" UNIQUE ("stripe_payout_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "conversation_archived_by_idx" ON "public"."conversation" USING "gin" ("archived_by");



CREATE INDEX "conversation_unread_by_idx" ON "public"."conversation" USING "gin" ("unread_by");



CREATE INDEX "idx_mentor_availability_mentor_id" ON "public"."mentor_availability" USING "btree" ("mentor_id");



CREATE INDEX "idx_mentor_expertise_mentor_id" ON "public"."mentor_expertise" USING "btree" ("mentor_id");



CREATE INDEX "idx_mentor_expertise_name" ON "public"."mentor_expertise" USING "btree" ("expertise");



CREATE INDEX "idx_mentor_languages_code" ON "public"."mentor_languages" USING "btree" ("language_code");



CREATE INDEX "idx_mentor_languages_level" ON "public"."mentor_languages" USING "btree" ("proficiency_level");



CREATE INDEX "idx_mentor_languages_mentor_id" ON "public"."mentor_languages" USING "btree" ("mentor_id");



CREATE INDEX "idx_mentor_reviews_mentor_id" ON "public"."mentor_reviews" USING "btree" ("mentor_id");



CREATE INDEX "idx_mentor_reviews_user_id" ON "public"."mentor_reviews" USING "btree" ("user_id");



CREATE INDEX "idx_mentors_user_id" ON "public"."mentors" USING "btree" ("user_id");



CREATE INDEX "idx_payments_mentor_id" ON "public"."payments" USING "btree" ("mentor_id");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_payments_user_id" ON "public"."payments" USING "btree" ("user_id");



CREATE INDEX "idx_payouts_mentor_id" ON "public"."payouts" USING "btree" ("mentor_id");



CREATE INDEX "idx_payouts_status" ON "public"."payouts" USING "btree" ("status");



CREATE INDEX "mentor_favorites_mentor_id_idx" ON "public"."mentor_favorites" USING "btree" ("mentor_id");



CREATE INDEX "mentor_favorites_user_id_created_at_idx" ON "public"."mentor_favorites" USING "btree" ("user_id", "created_at" DESC);



CREATE OR REPLACE TRIGGER "set_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_payouts_updated_at" BEFORE UPDATE ON "public"."payouts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_mentor_stats_on_review" AFTER INSERT OR DELETE OR UPDATE ON "public"."mentor_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_mentor_review_stats"();



CREATE OR REPLACE TRIGGER "update_mentors_updated_at" BEFORE UPDATE ON "public"."mentors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."conversation"
    ADD CONSTRAINT "Conversation_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."mentor_availability"
    ADD CONSTRAINT "mentor_availability_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentor_expertise"
    ADD CONSTRAINT "mentor_expertise_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentor_favorites"
    ADD CONSTRAINT "mentor_favorites_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentor_favorites"
    ADD CONSTRAINT "mentor_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentor_languages"
    ADD CONSTRAINT "mentor_languages_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentor_reviews"
    ADD CONSTRAINT "mentor_reviews_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentor_reviews"
    ADD CONSTRAINT "mentor_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentors"
    ADD CONSTRAINT "mentors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message"
    ADD CONSTRAINT "message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE RESTRICT;



CREATE POLICY "Allow authenticated insert" ON "public"."mentor_reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated insert" ON "public"."mentors" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow author delete" ON "public"."mentor_reviews" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow author update" ON "public"."mentor_reviews" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow mentor delete" ON "public"."mentor_availability" FOR DELETE USING (("mentor_id" IN ( SELECT "mentors"."id"
   FROM "public"."mentors"
  WHERE ("mentors"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow mentor delete" ON "public"."mentor_expertise" FOR DELETE USING (("mentor_id" IN ( SELECT "mentors"."id"
   FROM "public"."mentors"
  WHERE ("mentors"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow mentor delete" ON "public"."mentor_languages" FOR DELETE USING (("mentor_id" IN ( SELECT "mentors"."id"
   FROM "public"."mentors"
  WHERE ("mentors"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow mentor insert" ON "public"."mentor_availability" FOR INSERT WITH CHECK (("mentor_id" IN ( SELECT "mentors"."id"
   FROM "public"."mentors"
  WHERE ("mentors"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow mentor insert" ON "public"."mentor_expertise" FOR INSERT WITH CHECK (("mentor_id" IN ( SELECT "mentors"."id"
   FROM "public"."mentors"
  WHERE ("mentors"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow mentor insert" ON "public"."mentor_languages" FOR INSERT WITH CHECK (("mentor_id" IN ( SELECT "mentors"."id"
   FROM "public"."mentors"
  WHERE ("mentors"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow mentor update" ON "public"."mentor_availability" FOR UPDATE USING (("mentor_id" IN ( SELECT "mentors"."id"
   FROM "public"."mentors"
  WHERE ("mentors"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow mentor update" ON "public"."mentor_expertise" FOR UPDATE USING (("mentor_id" IN ( SELECT "mentors"."id"
   FROM "public"."mentors"
  WHERE ("mentors"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow mentor update" ON "public"."mentor_languages" FOR UPDATE USING (("mentor_id" IN ( SELECT "mentors"."id"
   FROM "public"."mentors"
  WHERE ("mentors"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow owner delete" ON "public"."mentors" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow owner update" ON "public"."mentors" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow public read" ON "public"."mentor_availability" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."mentor_expertise" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."mentor_languages" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."mentor_reviews" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."mentors" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can read bookings" ON "public"."bookings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Enable read access for all users" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Mentors can view own payouts" ON "public"."payouts" FOR SELECT USING (("auth"."uid"() IN ( SELECT "mentors"."user_id"
   FROM "public"."mentors"
  WHERE ("mentors"."id" = "payouts"."mentor_id"))));



CREATE POLICY "Mentors can view their payments" ON "public"."payments" FOR SELECT USING (("auth"."uid"() IN ( SELECT "mentors"."user_id"
   FROM "public"."mentors"
  WHERE ("mentors"."id" = "payments"."mentor_id"))));



CREATE POLICY "Policy with security definer functions" ON "public"."users" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own bookings" ON "public"."bookings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own payments" ON "public"."payments" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversation_insert_participants" ON "public"."conversation" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("mentor_id" = "auth"."uid"()) OR ("student_id" = "auth"."uid"()))));



CREATE POLICY "conversation_select_participants" ON "public"."conversation" FOR SELECT TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (("mentor_id" = "auth"."uid"()) OR ("student_id" = "auth"."uid"()))));



CREATE POLICY "conversation_update_participants" ON "public"."conversation" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (("mentor_id" = "auth"."uid"()) OR ("student_id" = "auth"."uid"())))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("mentor_id" = "auth"."uid"()) OR ("student_id" = "auth"."uid"()))));



ALTER TABLE "public"."mentor_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentor_expertise" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentor_favorites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mentor_favorites_delete_own" ON "public"."mentor_favorites" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "mentor_favorites_insert_own" ON "public"."mentor_favorites" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "mentor_favorites_select_own" ON "public"."mentor_favorites" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."mentor_languages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentor_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "message_insert_participants" ON "public"."message" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("sender_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."conversation" "c"
  WHERE (("c"."id" = "message"."conversation_id") AND (("c"."mentor_id" = "auth"."uid"()) OR ("c"."student_id" = "auth"."uid"())))))));



CREATE POLICY "message_select_participants" ON "public"."message" FOR SELECT TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."conversation" "c"
  WHERE (("c"."id" = "message"."conversation_id") AND (("c"."mentor_id" = "auth"."uid"()) OR ("c"."student_id" = "auth"."uid"())))))));



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payouts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read own admin membership" ON "public"."admin_users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "users_select_conversation_partners" ON "public"."users" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."conversation" "c"
  WHERE ((("c"."mentor_id" = "auth"."uid"()) AND ("c"."student_id" = "users"."id")) OR (("c"."student_id" = "auth"."uid"()) AND ("c"."mentor_id" = "users"."id")))))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."archive_conversation"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."archive_conversation"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_conversation"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_conversation_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_conversation_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_conversation_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_conversation_as_unread"("p_conversation_id" "uuid", "p_receiver_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_conversation_as_unread"("p_conversation_id" "uuid", "p_receiver_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_conversation_as_unread"("p_conversation_id" "uuid", "p_receiver_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_mentor_review_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_mentor_review_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_mentor_review_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_public_user_from_auth"("p_user_id" "uuid", "p_email" "text", "p_phone" "text", "p_user_meta" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_public_user_from_auth"("p_user_id" "uuid", "p_email" "text", "p_phone" "text", "p_user_meta" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_public_user_from_auth"("p_user_id" "uuid", "p_email" "text", "p_phone" "text", "p_user_meta" "jsonb") TO "service_role";


















GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bookings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bookings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bookings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."conversation" TO "anon";
GRANT ALL ON TABLE "public"."conversation" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation" TO "service_role";



GRANT ALL ON TABLE "public"."mentor_availability" TO "anon";
GRANT ALL ON TABLE "public"."mentor_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."mentor_availability" TO "service_role";



GRANT ALL ON TABLE "public"."mentor_expertise" TO "anon";
GRANT ALL ON TABLE "public"."mentor_expertise" TO "authenticated";
GRANT ALL ON TABLE "public"."mentor_expertise" TO "service_role";



GRANT ALL ON TABLE "public"."mentor_favorites" TO "anon";
GRANT ALL ON TABLE "public"."mentor_favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."mentor_favorites" TO "service_role";



GRANT ALL ON SEQUENCE "public"."mentor_favorites_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."mentor_favorites_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."mentor_favorites_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."mentor_languages" TO "anon";
GRANT ALL ON TABLE "public"."mentor_languages" TO "authenticated";
GRANT ALL ON TABLE "public"."mentor_languages" TO "service_role";



GRANT ALL ON TABLE "public"."mentor_reviews" TO "anon";
GRANT ALL ON TABLE "public"."mentor_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."mentor_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."mentors" TO "anon";
GRANT ALL ON TABLE "public"."mentors" TO "authenticated";
GRANT ALL ON TABLE "public"."mentors" TO "service_role";



GRANT ALL ON TABLE "public"."message" TO "anon";
GRANT ALL ON TABLE "public"."message" TO "authenticated";
GRANT ALL ON TABLE "public"."message" TO "service_role";



GRANT ALL ON SEQUENCE "public"."message_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."message_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."message_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."payouts" TO "anon";
GRANT ALL ON TABLE "public"."payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."payouts" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


