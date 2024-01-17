#!/bin/bash
sudo certbot certonly --nginx -d ultri.space -d api.ultri.space -d www.ultri.space
sudo certbot certonly --nginx -d ultri.shop api.ultri.shop www.ultri.shop
sudo certbot certonly --nginx -d ultri.com api.ultri.com www.ultri.com
