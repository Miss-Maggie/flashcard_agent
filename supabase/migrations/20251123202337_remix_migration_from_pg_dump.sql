CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;


SET default_table_access_method = heap;

--
-- Name: flashcards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flashcards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    topic text NOT NULL,
    mode text NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    category text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quiz_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    topic text NOT NULL,
    mode text NOT NULL,
    total_questions integer NOT NULL,
    correct_answers integer NOT NULL,
    score_percentage numeric(5,2) NOT NULL,
    time_taken_seconds integer,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,
    questions_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid
);


--
-- Name: flashcards flashcards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flashcards
    ADD CONSTRAINT flashcards_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: quiz_results quiz_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_results
    ADD CONSTRAINT quiz_results_pkey PRIMARY KEY (id);


--
-- Name: idx_flashcards_user_topic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flashcards_user_topic ON public.flashcards USING btree (user_id, topic, created_at DESC);


--
-- Name: idx_quiz_results_completed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_results_completed_at ON public.quiz_results USING btree (completed_at DESC);


--
-- Name: idx_quiz_results_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_results_score ON public.quiz_results USING btree (score_percentage DESC);


--
-- Name: idx_quiz_results_topic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_results_topic ON public.quiz_results USING btree (topic);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: quiz_results quiz_results_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_results
    ADD CONSTRAINT quiz_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: flashcards Users can delete own flashcards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own flashcards" ON public.flashcards FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: quiz_results Users can delete own quiz results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own quiz results" ON public.quiz_results FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: flashcards Users can insert own flashcards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own flashcards" ON public.flashcards FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: quiz_results Users can insert own quiz results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own quiz results" ON public.quiz_results FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: flashcards Users can update own flashcards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own flashcards" ON public.flashcards FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: quiz_results Users can update own quiz results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own quiz results" ON public.quiz_results FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: flashcards Users can view own flashcards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own flashcards" ON public.flashcards FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: quiz_results Users can view own quiz results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own quiz results" ON public.quiz_results FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: flashcards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


