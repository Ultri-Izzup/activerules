#!/bin/bash
cd ./proxy/certs/local
mkcert example.com api.example.com www.example.com
mkcert com.example.com api.com.example.com www.com.example.com
mkcert space.example.com api.space.example.com www.space.example.com
mkcert shop.example.com api.shop.example.com www.shop.example.com