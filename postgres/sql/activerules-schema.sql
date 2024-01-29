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

