--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4 (Debian 15.4-2.pgdg120+1)
-- Dumped by pg_dump version 16.1 (Ubuntu 16.1-1.pgdg22.04+1)

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

--
-- Data for Name: realm; Type: TABLE DATA; Schema: entity; Owner: -
--

COPY entity.realm (id, domain) FROM stdin;
1	ultri.com
2	ultri.shop
3	ultri.space
4	izzup.shop
5	usevue.org
6	cycleopedia.org
7	opensociocracy.org
8	democratic.space
\.


--
-- Name: realm_id_seq; Type: SEQUENCE SET; Schema: entity; Owner: -
--

SELECT pg_catalog.setval('entity.realm_id_seq', 8, true);


--
-- PostgreSQL database dump complete
--

