#!/bin/bash
sudo apt update
sudo apt upgrade -y
sudo apt remove certbot
sudo apt install snapd -y
sudo snap install core
sudo snap install --classic certbot -y
sudo ln -s /snap/bin/certbot /usr/bin/certbot