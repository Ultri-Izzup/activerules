#!/bin/bash
PGPASSWORD=activerules_postgres_root_pass pg_dump -s -O -h localhost -U postgres -d activerules > ./postgres/sql/activerules.sql 