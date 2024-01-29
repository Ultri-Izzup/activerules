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

CREATE FUNCTION entity.member_by_email(email_in character varying) RETURNS TABLE(member_id integer, display_name character varying)
    LANGUAGE plpgsql
    AS $$

	DECLARE member_id INTEGER;
	DECLARE member_display_name CHARACTER VARYING;
	
	BEGIN
	
	SELECT entity.member.id, entity.member.display_name FROM entity.member WHERE email_hash = digest(LOWER(email_in), 'sha256')
	INTO member_id, member_display_name;
	
	IF member_id IS NULL THEN
		INSERT INTO entity.member(email, email_hash) VALUES(LOWER(email_in), digest(LOWER(email_in), 'sha256'))
		RETURNING entity.member.id, entity.member.display_name INTO member_id, member_display_name;
	END IF;
	
	RETURN QUERY SELECT member_id, member_display_name;
	
	END;	
$$;


--
-- Name: member_id_by_email(character varying); Type: FUNCTION; Schema: entity; Owner: -
--

CREATE FUNCTION entity.member_id_by_email(email_in character varying) RETURNS integer
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
-- Name: member_signin_accounts(uuid, character varying, bigint, character varying); Type: FUNCTION; Schema: entity; Owner: -
--

CREATE FUNCTION entity.member_signin_accounts(uid_in uuid, email_in character varying, created_at_in bigint, realm_in character varying) RETURNS TABLE(member_id integer, display_name character varying, created_at timestamp with time zone, email character varying, account_name character varying, related text, related_at timestamp with time zone, domain character varying)
    LANGUAGE plpgsql
    AS $$

	DECLARE found_member_id INTEGER;
	DECLARE found_display_name CHARACTER VARYING;
	DECLARE found_realm_id SMALLINT;
	
	BEGIN
	
	SELECT member_by_email.member_id, member_by_email.display_name FROM entity.member_by_email(
		email_in
	) INTO found_member_id, found_display_name;
	
	SELECT id FROM entity.realm WHERE entity.realm.domain = realm_in INTO found_realm_id;
	
	INSERT INTO entity.credential(uid, realm_id, member_id, created_at, last_login_at)
	VALUES(uid_in, found_realm_id, found_member_id, TO_TIMESTAMP(created_at_in/1000), CURRENT_TIMESTAMP)
	ON CONFLICT ON CONSTRAINT credential_pkey DO UPDATE SET last_login_at = CURRENT_TIMESTAMP;
	
	RETURN QUERY SELECT found_member_id, found_display_name, m.created_at, m.email, m.display_name, c.uid::text, c.created_at, r.domain
	FROM entity.member m
     JOIN entity.credential c ON c.member_id = m.id
     JOIN entity.realm r ON r.id = c.realm_id
	 WHERE m.id = found_member_id
	UNION
	 SELECT found_member_id, found_display_name, m.created_at, m.email, m.display_name, f.id::text, f.created_at, r.domain
   	FROM entity.member m
	 JOIN entity.fediverse f ON f.member_id = m.id
	 JOIN entity.realm r ON r.id = f.realm_id
    WHERE m.id = found_member_id
	;

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
    display_name character varying,
    uid uuid DEFAULT gen_random_uuid() NOT NULL
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
cb652b61-10c8-42db-b58f-aaf900227f6b	1	1	2024-01-29 06:06:02+00	2024-01-29 06:06:03.339679+00
35115b8b-7488-4ad5-8d97-a9ab47a1bbd7	1	2	2024-01-29 06:43:03+00	2024-01-29 06:48:17.841758+00
9249779f-dc11-4c84-8900-329b47d9b93c	1	3	2024-01-29 08:31:36+00	2024-01-29 08:38:11.575062+00
59987a17-6828-417f-9be0-09ee7211290c	1	4	2024-01-29 08:40:25+00	2024-01-29 08:40:26.286169+00
6aa73fe1-d7bb-4032-8d36-8970f45af41b	1	5	2024-01-29 09:12:30+00	2024-01-29 09:12:31.28006+00
10232433-6c05-41c8-aeab-30a029e0642c	1	6	2024-01-29 09:14:21+00	2024-01-29 09:14:21.517527+00
72ee4660-4198-473f-9825-0e9c8f2d1aaf	1	7	2024-01-29 09:19:01+00	2024-01-29 09:19:01.674153+00
0f8312fd-3fbd-4686-ba39-fd18a31ace38	1	8	2024-01-29 09:23:01+00	2024-01-29 09:23:01.221024+00
d3010572-065c-4c5d-ad58-c35c213b898c	1	9	2024-01-29 09:25:56+00	2024-01-29 09:25:56.081038+00
64eba8c3-f016-4da2-9d2e-cb72711f03e5	1	10	2024-01-29 09:29:50+00	2024-01-29 09:29:50.867125+00
569d8a98-02fb-4119-b120-588504390c55	1	11	2024-01-29 09:38:13+00	2024-01-29 09:38:14.186924+00
b8aa41f8-a878-4e12-924f-170eab605a45	1	12	2024-01-29 09:44:05+00	2024-01-29 09:44:06.117832+00
388df252-a7ca-4210-9dcb-4952d646dcef	1	13	2024-01-29 09:47:53+00	2024-01-29 09:47:54.210503+00
7967fd4f-6a04-4d19-b4ce-05a214b67a41	1	14	2024-01-29 09:58:29+00	2024-01-29 09:58:29.4771+00
cbd065bf-aa63-4628-a577-496ec1780520	1	15	2024-01-29 10:00:06+00	2024-01-29 10:00:06.608271+00
a0251894-d36a-477f-8132-2c75aa8b7366	1	16	2024-01-29 10:03:33+00	2024-01-29 10:03:34.392681+00
92eb6fed-d99d-4004-97d7-8a69f4035089	1	17	2024-01-29 10:04:46+00	2024-01-29 10:04:46.79107+00
ab01c2db-8e0e-41f2-b26d-e545d72ba75f	1	18	2024-01-29 10:08:09+00	2024-01-29 10:08:09.733818+00
e139ee30-4c4e-4233-84be-e5e69730ba2b	1	19	2024-01-29 10:09:19+00	2024-01-29 10:09:19.911676+00
b58aa6e0-0f27-402d-a9da-ff81572208cf	1	20	2024-01-29 10:10:01+00	2024-01-29 10:10:01.78211+00
5ecfe2b2-7f27-4da9-a072-d266c1923058	1	21	2024-01-29 10:46:41+00	2024-01-29 10:46:42.050584+00
ba391c90-3253-458e-b5e6-2f67d73b4454	1	22	2024-01-29 10:47:28+00	2024-01-29 10:47:28.720598+00
7887eebb-894a-42bd-8d59-66901876a17d	1	23	2024-01-29 10:49:05+00	2024-01-29 10:49:05.98409+00
87341152-00c2-4322-b5ca-618e7b4fa09b	1	24	2024-01-29 16:57:44+00	2024-01-29 16:57:44.466071+00
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

COPY entity.member (id, email_hash, created_at, email, display_name, uid) FROM stdin;
1	\\x8a74e35f7169edbb440dcef915bd09cfa9d26cb92b73076b5b4624a785d7af9d	2024-01-29 06:06:03.339679+00	skyla60@example.com	\N	c4318d5c-cd1c-40e3-bd19-f16103f2c1a9
2	\\x4bdefb67cb45cab59346c111f27ad095089ce8da25cd1953a4204164388d8cb9	2024-01-29 06:43:04.331227+00	ricky.feil95@example.com	\N	2d63512d-bdca-459b-b013-a2e0b6ddb195
3	\\xea6598aada069fcfcdb1a74de607f057944645760e06d4a7a2fe3a5cfff9709d	2024-01-29 08:31:36.674998+00	kody_sporer@example.net	\N	0ac10aae-307c-4613-93c4-515fc236be2e
4	\\x9b533c4ebcb6a168e40bbbeb951445703f1d1a8f17fe228bac1696626a71fb81	2024-01-29 08:40:26.286169+00	lesly_reilly@example.com	\N	b2cef76a-fd24-4cab-b2d7-eeaca56af312
5	\\x0fdee7d6d6442788005481528fcd2ce3101d528bd89102c9ca4a058d671f37ba	2024-01-29 09:12:31.28006+00	sefsdfs@sefewf.com	\N	50bab383-0d5e-42e9-a94a-576ee58ecac3
6	\\xff49a91e58581c9aed71fa5ad5ab7576924318ad5c303539a9281f0c680f1188	2024-01-29 09:14:21.517527+00	sdgvdfvgfd@erfgref.com	\N	f5b974c3-9828-4dd6-87fb-cc187444f29c
7	\\x14c3634477fd54cccd49ade89c8d377a9f26cd88e2b5949c7a76fba666c5ab46	2024-01-29 09:19:01.674153+00	drfgdf@efdew.com	\N	521702a6-abc1-4fb4-b662-1d400d9b3b5a
8	\\x7faf545f9d90af7357a0120127dec3381faa80e63d3fb1b2d408017b527d257d	2024-01-29 09:23:01.221024+00	rfgdfdg@ewfewf.com	\N	40876087-130e-435a-8bfc-1e84d2a1b047
9	\\x7ffad5a7b0e7ae61c89a0cc665e95eda4e8189a0665e91ff3c37dd79708e59f6	2024-01-29 09:25:56.081038+00	rfgfd@asda.com	\N	93d80751-e689-44b6-a646-9512ff65ddd9
10	\\x40ef91beaa8518586aab0d1f8753197a8142687be8703d22f774e2b4c9df17fa	2024-01-29 09:29:50.867125+00	edgdfgdf@sdefs.com	\N	e236f590-05c1-4bd9-a863-dbebce8fc689
11	\\x85eda782304d47b258a721e19888a5f1ea2b9221a87aa17249768a0fb8ac8efa	2024-01-29 09:38:14.186924+00	dfvgdfvd@sefeswfc.com	\N	8d639ce0-9672-4d21-ad33-302ab4bf5a54
12	\\x336167fc6f5fb9e5e300c5e40ffc3205fd21e1c1e1fb16785525a7c9dd979977	2024-01-29 09:44:06.117832+00	dsfsdf@sdfgds.com	\N	7b162be6-530f-4ae5-87c6-80996ff84150
13	\\x9566abfa27aa7f112d8c08f6692f87158cef94f3c87b9c23369102959cad402e	2024-01-29 09:47:54.210503+00	dsxvsdfjvi@sefesw.com	\N	caa89276-c68f-48f5-9f25-5b1d240c2d5f
14	\\x1f82759f25a5083c8b25539b6e0541478da456b3e0f16b5dc2a1f7e1854360be	2024-01-29 09:58:29.4771+00	scsdefcsdcs@ed.com	\N	91df7dd9-8871-479f-adab-c523e07dcafe
15	\\x4085470f7ce41be51b43e385a3b71405910f3bfba36279bbb64357c04f41eeee	2024-01-29 10:00:06.608271+00	dfvfdvdv@efdewf.ck	\N	d0a8f2f8-62b4-4f9e-b7bd-505665257d27
16	\\xd8192dc3f1eba875b1400c6bbeb13f7a1b4a57c6bb42ebf6c474c372633543b0	2024-01-29 10:03:34.392681+00	fgbgfbfg@referfc.com	\N	25eec82c-e06b-4399-aeac-679f3275f104
17	\\x04463042b32889649c03fcd5fd45a28bacd3c0a7fc624d785a11fe2aa3c7b21d	2024-01-29 10:04:46.79107+00	fdvfdvd@erfte.com	\N	37128877-1ede-4119-b369-e99549641761
18	\\xf285aa38bc9dee329bc0d717c5045193642ae195b0dba99bba1d9fe67488b254	2024-01-29 10:08:09.733818+00	pierce72@example.org	\N	b83faa43-374b-4daf-9791-6cd42ef043f9
19	\\x2fcd055cf7d896694c6378ed6042a694f88e783b53a1cd6ccc810798827dc326	2024-01-29 10:09:19.911676+00	jacynthe39@example.net	\N	195854dd-bdd3-4261-a2d9-4dd9675c47bf
20	\\x47234ace17fb803bddc5e6b1627c20310ce5caed58bd52f4bbee2241b781b01d	2024-01-29 10:10:01.78211+00	alexa.nienow90@example.net	\N	0fd9c33e-78ed-4618-9b4e-1a1bb0dde0fe
21	\\x348562e96281167306e31d0f220b65270b6a76c9d38ac59251090a73bea6b8b7	2024-01-29 10:46:42.050584+00	werfwefw@erfer.vom	\N	576dd612-4830-4435-860f-d62e6ebd23be
22	\\x65567061ef401697d561e4915e91488ed7e22c9e743c6aea47e9d5240235d520	2024-01-29 10:47:28.720598+00	alvis.dicki@example.net	\N	b0af4fac-0fd7-465f-a7c3-4367ec80d2ba
23	\\x709d0436574595aee54ba2ce1c1f4ae60195b5f1aa53fbea2963db79e12d3b83	2024-01-29 10:49:05.98409+00	trhtrhrt@efewf.com	\N	59ff66cd-9412-41ca-8ad2-4896c9312691
24	\\xb7f51bfeaa2bd96ee44535936d84a63466aa51d3ad2e50c085784a14b51156cb	2024-01-29 16:57:44.466071+00	demarco_simonis2@example.net	\N	64b5d8f1-8a8a-4a09-a03a-e05d7159fc1c
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

SELECT pg_catalog.setval('entity.member_id_seq', 24, true);


--
-- Name: realm_id_seq; Type: SEQUENCE SET; Schema: entity; Owner: -
--

SELECT pg_catalog.setval('entity.realm_id_seq', 8, true);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: entity; Owner: -
--

SELECT pg_catalog.setval('entity.role_id_seq', 1, false);


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
-- Name: member uq_member_uid; Type: CONSTRAINT; Schema: entity; Owner: -
--

ALTER TABLE ONLY entity.member
    ADD CONSTRAINT uq_member_uid UNIQUE (uid);


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

