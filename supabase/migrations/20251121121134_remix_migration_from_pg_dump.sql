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



SET default_table_access_method = heap;

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
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quiz_results quiz_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_results
    ADD CONSTRAINT quiz_results_pkey PRIMARY KEY (id);


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
-- Name: quiz_results Anyone can insert quiz results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert quiz results" ON public.quiz_results FOR INSERT WITH CHECK (true);


--
-- Name: quiz_results Quiz results are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Quiz results are viewable by everyone" ON public.quiz_results FOR SELECT USING (true);


--
-- Name: quiz_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


