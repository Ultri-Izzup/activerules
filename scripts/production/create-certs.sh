#!/bin/bash
# sudo certbot certonly --nginx --dry-run -d ultri.space -d api.ultri.space -d www.ultri.space
# sudo certbot certonly --nginx --dry-run -d ultri.shop -d api.ultri.shop -d www.ultri.shop
# sudo certbot certonly --nginx -d api.ultri.com -d www.ultri.com

# docker compose -f ./infrastructure/production/certbot-compose.yaml run --rm  certbot certonly --dry-run --webroot --webroot-path /var/www/certbot/ -d ultri.space -d www.ultri.space -d api.ultri.space

