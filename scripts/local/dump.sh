#!/bin/bash
# CURRENT DEV DATA
PGPASSWORD=activerules_postgres_root_pass pg_dump -O -h localhost -U postgres -d activerules > ./postgres/sql/activerules.sql 
# CURRENT SCHEMA
PGPASSWORD=activerules_postgres_root_pass pg_dump -O -h localhost -U postgres -d activerules --schema-only > ./postgres/sql/activerules-schema.sql 
## LOOKUP TABLES
PGPASSWORD=activerules_postgres_root_pass pg_dump -O -h localhost -U postgres -d activerules --table entity.realm --data-only > ./postgres/sql/activerules-realms-data.sql 