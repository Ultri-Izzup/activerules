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
-- Name: entity; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA entity;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: member_by_email(character varying); Type: FUNCTION; Schema: entity; Owner: -
--

CREATE FUNCTION entity.member_by_email(email_in character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$

	DECLARE member_id INTEGER;
	
	BEGIN
	
	SELECT id FROM entity.member WHERE email_hash = digest(LOWER(email_in), 'sha256')
	INTO member_id;
	
	IF member_id IS NULL THEN
		INSERT INTO entity.member(email, email_hash) VALUES(LOWER(email_in), digest(LOWER(email_in), 'sha256'))
		RETURNING id INTO member_id;
	END IF;
	
	RETURN member_id;
	
	END;	
$$;


--
-- Name: member_signin(uuid, character varying, bigint, character varying); Type: FUNCTION; Schema: entity; Owner: -
--

CREATE FUNCTION entity.member_signin(uid_in uuid, email_in character varying, created_at_in bigint, realm_in character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$

	DECLARE found_member_id INTEGER;
	DECLARE found_realm_id SMALLINT;
	
	BEGIN
	
	SELECT * FROM entity.member_by_email(
		email_in
	) INTO found_member_id;
	
	SELECT id FROM entity.realm WHERE domain = realm_in INTO found_realm_id;
	
	INSERT INTO entity.credential(uid, realm_id, member_id, created_at, last_login_at)
	VALUES(uid_in, found_realm_id, found_member_id, TO_TIMESTAMP(created_at_in/1000), CURRENT_TIMESTAMP)
	ON CONFLICT ON CONSTRAINT credential_pkey DO UPDATE SET last_login_at = CURRENT_TIMESTAMP;
	
	RETURN found_member_id;
	
	END;	
$$;


--
-- Name: member_by_email(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.member_by_email(email character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
	BEGIN
	
	SELECT id FROM entity.member WHERE email_hash = digest(LOWER(email), 'sha256');
	
	
	
	END;	
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: credential; Type: TABLE; Schema: entity; Owner: -
--

CREATE TABLE entity.credential (
    uid uuid NOT NULL,
    realm_id smallint NOT NULL,
    member_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login_at timestamp with time zone
);


--
-- Name: fediverse; Type: TABLE; Schema: entity; Owner: -
--

CREATE TABLE entity.fediverse (
    id integer NOT NULL,
    realm_id smallint NOT NULL,
    username character varying(20) NOT NULL,
    member_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: fediverse_id_seq; Type: SEQUENCE; Schema: entity; Owner: -
--

CREATE SEQUENCE entity.fediverse_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fediverse_id_seq; Type: SEQUENCE OWNED BY; Schema: entity; Owner: -
--

ALTER SEQUENCE entity.fediverse_id_seq OWNED BY entity.fediverse.id;


--
-- Name: group; Type: TABLE; Schema: entity; Owner: -
--

CREATE TABLE entity."group" (
    id integer NOT NULL,
    uid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    name character varying(60) NOT NULL
);


--
-- Name: group_id_seq; Type: SEQUENCE; Schema: entity; Owner: -
--

CREATE SEQUENCE entity.group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_id_seq; Type: SEQUENCE OWNED BY; Schema: entity; Owner: -
--

ALTER SEQUENCE entity.group_id_seq OWNED BY entity."group".id;


--
-- Name: group_member; Type: TABLE; Schema: entity; Owner: -
--

CREATE TABLE entity.group_member (
    member_id integer NOT NULL,
    group_id integer NOT NULL,
    role_ids integer[] NOT NULL
);


--
-- Name: member; Type: TABLE; Schema: entity; Owner: -
--

CREATE TABLE entity.member (
    id integer NOT NULL,
    email_hash bytea NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    email character varying NOT NULL,
    display_name character varying
);


--
-- Name: realm; Type: TABLE; Schema: entity; Owner: -
--

CREATE TABLE entity.realm (
    id smallint NOT NULL,
    domain character varying(100) NOT NULL
);


--
-- Name: member_credentials; Type: VIEW; Schema: entity; Owner: -
--

CREATE VIEW entity.member_credentials AS
 SELECT m.id AS member_id,
    m.created_at AS member_created_at,
    m.email,
    m.display_name AS name,
    (c.uid)::text AS related,
    c.created_at AS related_created_at,
    r.domain
   FROM ((entity.member m
     JOIN entity.credential c ON ((c.member_id = m.id)))
     JOIN entity.realm r ON ((r.id = c.realm_id)));


--
-- Name: member_fediverse_accounts; Type: VIEW; Schema: entity; Owner: -
--

CREATE VIEW entity.member_fediverse_accounts AS
 SELECT m.id AS member_id,
    m.created_at AS member_created_at,
    m.email,
    f.username AS name,
    (f.id)::text AS related,
    f.created_at AS related_created_at,
    r.domain
   FROM ((entity.member m
     JOIN entity.fediverse f ON ((f.member_id = m.id)))
     JOIN entity.realm r ON ((r.id = f.realm_id)));


--
-- Name: member_id_seq; Type: SEQUENCE; Schema: entity; Owner: -
--

CREATE SEQUENCE entity.member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: member_id_seq; Type: SEQUENCE OWNED BY; Schema: entity; Owner: -
--

ALTER SEQUENCE entity.member_id_seq OWNED BY entity.member.id;


--
-- Name: realm_id_seq; Type: SEQUENCE; Schema: entity; Owner: -
--

CREATE SEQUENCE entity.realm_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: realm_id_seq; Type: SEQUENCE OWNED BY; Schema: entity; Owner: -
--

ALTER SEQUENCE entity.realm_id_seq OWNED BY entity.realm.id;


--
-- Name: role; Type: TABLE; Schema: entity; Owner: -
--

CREATE TABLE entity.role (
    id integer NOT NULL,
    uid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    name character varying(60)
);


--
-- Name: role_id_seq; Type: SEQUENCE; Schema: entity; Owner: -
--

CREATE SEQUENCE entity.role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_id_seq; Type: SEQUENCE OWNED BY; Schema: entity; Owner: -
--

ALTER SEQUENCE entity.role_id_seq OWNED BY entity.role.id;


--
-- Name: fediverse id; Type: DEFAULT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.fediverse ALTER COLUMN id SET DEFAULT nextval('entity.fediverse_id_seq'::regclass);


--
-- Name: group id; Type: DEFAULT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity."group" ALTER COLUMN id SET DEFAULT nextval('entity.group_id_seq'::regclass);


--
-- Name: member id; Type: DEFAULT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.member ALTER COLUMN id SET DEFAULT nextval('entity.member_id_seq'::regclass);


--
-- Name: realm id; Type: DEFAULT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.realm ALTER COLUMN id SET DEFAULT nextval('entity.realm_id_seq'::regclass);


--
-- Name: role id; Type: DEFAULT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.role ALTER COLUMN id SET DEFAULT nextval('entity.role_id_seq'::regclass);


--
-- Data for Name: credential; Type: TABLE DATA; Schema: entity; Owner: -
--

COPY entity.credential (uid, realm_id, member_id, created_at, last_login_at) FROM stdin;
3e0a78a8-41da-4310-bad3-5e0924abf038	2	1	2024-01-22 11:05:37+00	\N
6e55035e-aa15-4c4d-a2b9-e64c0e55a2f3	2	2	2024-01-21 18:21:57+00	\N
0d3a0ee9-ff10-47d5-8947-640bb3a0c865	2	3	2024-01-22 23:20:45+00	2024-01-22 23:20:45.604827+00
f2edc80f-6bad-47cb-9b71-53cd2eaa701a	3	1	2024-01-23 01:05:00+00	2024-01-23 01:05:01.22549+00
\.


--
-- Data for Name: fediverse; Type: TABLE DATA; Schema: entity; Owner: -
--

COPY entity.fediverse (id, realm_id, username, member_id, created_at) FROM stdin;
\.


--
-- Data for Name: group; Type: TABLE DATA; Schema: entity; Owner: -
--

COPY entity."group" (id, uid, created_at, name) FROM stdin;
\.


--
-- Data for Name: group_member; Type: TABLE DATA; Schema: entity; Owner: -
--

COPY entity.group_member (member_id, group_id, role_ids) FROM stdin;
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: entity; Owner: -
--

COPY entity.member (id, email_hash, created_at, email, display_name) FROM stdin;
1	\\x957cd321ad236779bb7cc6050e2f968d5ae4c05efea09b5a8c8b7e3ad004c88c	2024-01-22 11:05:38.122034+00	bethany_beatty41@example.net	\N
2	\\x079cd91c09fa4c9d1512f2bc4b1b0dc6a9d9f3832f8a5911bc049d92e0507d6d	2024-01-22 23:01:03.677545+00	damian.hammes@example.org	\N
3	\\x09cc13279dc9f74a57ecfcd265324217c59ead60c6f44cfb39c4b9014f7e1779	2024-01-22 23:20:45.604827+00	tiara.keebler24@example.net	\N
\.


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
-- Data for Name: role; Type: TABLE DATA; Schema: entity; Owner: -
--

COPY entity.role (id, uid, created_at, name) FROM stdin;
1	1a0e2468-b554-4ab2-a427-828533135adb	2024-01-21 03:59:59.876607+00	owner
2	21d4bb69-6ef3-4911-8411-a968635d5bf4	2024-01-21 04:00:09.971982+00	member
3	3603205c-1e66-40a2-9407-998ba78a9ccd	2024-01-21 04:01:06.56595+00	facilitator
4	550c6def-9ecd-4428-8091-401991922b2c	2024-01-21 04:01:06.56595+00	secretary
6	75d4e342-e794-4e47-b408-8a49864b9971	2024-01-21 04:01:06.56595+00	leader
5	09167a7b-3c87-423a-bfab-5f061b95c647	2024-01-21 04:01:06.56595+00	delegate
7	380aed08-ca97-400b-8ed6-37cb00506e3b	2024-01-21 04:05:03.767447+00	reader
8	1d2c619e-7ece-4ee8-a353-2989de079c8e	2024-01-21 04:05:03.767447+00	writer
9	c374fe91-6514-49dc-923b-fd6e9fa0eb77	2024-01-21 04:05:03.767447+00	editor
10	bd25917d-93ab-409b-a97f-ac4a93d0eca6	2024-01-21 04:05:03.767447+00	publisher
11	6a9b3e3f-e084-4f2e-b431-57e20b53e0d0	2024-01-21 04:05:03.767447+00	reviewer
12	27c229ec-9499-46ba-8efd-29ad8d5d89c6	2024-01-21 04:05:03.767447+00	governance
\.


--
-- Name: fediverse_id_seq; Type: SEQUENCE SET; Schema: entity; Owner: -
--

SELECT pg_catalog.setval('entity.fediverse_id_seq', 1, false);


--
-- Name: group_id_seq; Type: SEQUENCE SET; Schema: entity; Owner: -
--

SELECT pg_catalog.setval('entity.group_id_seq', 1, false);


--
-- Name: member_id_seq; Type: SEQUENCE SET; Schema: entity; Owner: -
--

SELECT pg_catalog.setval('entity.member_id_seq', 3, true);


--
-- Name: realm_id_seq; Type: SEQUENCE SET; Schema: entity; Owner: -
--

SELECT pg_catalog.setval('entity.realm_id_seq', 8, true);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: entity; Owner: -
--

SELECT pg_catalog.setval('entity.role_id_seq', 12, true);


--
-- Name: credential credential_pkey; Type: CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.credential
    ADD CONSTRAINT credential_pkey PRIMARY KEY (uid);


--
-- Name: fediverse fediverse_pkey; Type: CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.fediverse
    ADD CONSTRAINT fediverse_pkey PRIMARY KEY (id);


--
-- Name: group_member group_member_pkey; Type: CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.group_member
    ADD CONSTRAINT group_member_pkey PRIMARY KEY (member_id, group_id);


--
-- Name: group group_pkey; Type: CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity."group"
    ADD CONSTRAINT group_pkey PRIMARY KEY (id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- Name: realm realm_pkey; Type: CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.realm
    ADD CONSTRAINT realm_pkey PRIMARY KEY (id);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: fediverse uq_fediverse_realm_member; Type: CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.fediverse
    ADD CONSTRAINT uq_fediverse_realm_member UNIQUE (realm_id, member_id);


--
-- Name: fediverse uq_fediverse_realm_username; Type: CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.fediverse
    ADD CONSTRAINT uq_fediverse_realm_username UNIQUE (realm_id, username);


--
-- Name: group uq_group_uid; Type: CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity."group"
    ADD CONSTRAINT uq_group_uid UNIQUE (uid);


--
-- Name: credential uq_identity_uid; Type: CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.credential
    ADD CONSTRAINT uq_identity_uid UNIQUE (uid);


--
-- Name: member uq_member_email_hash; Type: CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.member
    ADD CONSTRAINT uq_member_email_hash UNIQUE (email_hash);


--
-- Name: realm uq_realm_domain; Type: CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.realm
    ADD CONSTRAINT uq_realm_domain UNIQUE (domain);


--
-- Name: role uq_role_uid; Type: CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.role
    ADD CONSTRAINT uq_role_uid UNIQUE (uid);


--
-- Name: credential fk_credential_member_id; Type: FK CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.credential
    ADD CONSTRAINT fk_credential_member_id FOREIGN KEY (member_id) REFERENCES entity.member(id) NOT VALID;


--
-- Name: credential fk_credential_realm_id; Type: FK CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.credential
    ADD CONSTRAINT fk_credential_realm_id FOREIGN KEY (realm_id) REFERENCES entity.realm(id) NOT VALID;


--
-- Name: fediverse fk_fediverse_member_id; Type: FK CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.fediverse
    ADD CONSTRAINT fk_fediverse_member_id FOREIGN KEY (member_id) REFERENCES entity.member(id);


--
-- Name: fediverse fk_fediverse_realm_id; Type: FK CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.fediverse
    ADD CONSTRAINT fk_fediverse_realm_id FOREIGN KEY (realm_id) REFERENCES entity.realm(id);


--
-- PostgreSQL database dump complete
--

